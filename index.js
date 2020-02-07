const args = process.argv.slice(2) || []
const workingDir = args.length && args[0] || './'
const exec = require('child_process').exec;
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('inquirer')
const git = require('simple-git/promise')

clear()
console.log(chalk.yellow(figlet.textSync('Releaser', { horizontalLayout: 'full' })))

const execPromise = cmd => {
  return new Promise((resolve, reject) => 
    exec(cmd, (error, stdout, stderr) => {
     error && console.warn(error)
     resolve(stdout ? stdout : stderr)
    })
  )
}

const gitX = () => git(workingDir)
const releaseStart = async version => await gitX().raw(['flow','release','start', version])
const releaseFinish = async version => await gitX().raw(['flow','release','finish', '-F', '-m', version, version])
const tagExists = async version => await gitX().raw(['tag', '-l', version])
const pushMaster = async () => await gitX().raw(['push','origin','master'])
const pushDev = async () => await gitX().raw(['push','origin','dev'])
const pushTags = async () => await gitX().raw(['push','origin','--tags'])

const stash = async () => await gitX().raw(['stash'])
const status = async () => await gitX().raw(['status'])
const branch = async () => await gitX().raw(['branch'])
const fetch = async () => await gitX().raw(['fetch'],(err, result) => console.log(err, result))
const fetchTags = async () => await gitX().raw(['fetch', '--tags'])
const pull = async () => await gitX().raw(['pull', 'origin', 'HEAD'])
const goToBranch = async branchName => await gitX().raw(['checkout', branchName])

const changePackageJson = async version => {
  const file = `${workingDir}/package.json` 
  const lineReplace = `'s/"version": "\\(.*\\)"/"version": "${version}"/g'`
  const osName = process.platform
  const cmd = osName === 'darwin' ? `sed -i '' ${lineReplace} ${file}` : `sed -i ${lineReplace} ${file}`
  return await execPromise(cmd)
}
const addPackageJson = async () => await gitX().raw(['add', '-u'])
const commitPackageJson = async version => await gitX().raw(['commit', '-m', `chore(package): bump version to ${version}`])

const getlastRelease = async () => {
  const lastReleaseMessage = await gitX().raw(['log', '--merges', "--pretty=format:%s"])
  const lastVersionText = lastReleaseMessage && lastReleaseMessage.toString().split("\n").slice(0, 20).find(commitMessage => commitMessage.toLowerCase().includes('release') ) || '1.0.0'
  const correctLastVersion = await inquirer.prompt([{
    type: 'confirm',
    name: 'lastVersionConfirmation',
    message: `The last version number found ${lastVersionText} is correct?`
  }]).then(last => last.lastVersionConfirmation)

  return {
    correctLastVersion,
    lastVersion: getVersionNumberParsed(lastVersionText)
  }
}

const confirmNextVersionType = async () => {
  const questions = [{
    name: 'type',
    message: 'What version type you want to release ?',
    type: 'list',
    choices: ['patch', 'minor', 'major' ]
  }]
  return await inquirer.prompt(questions)
}

const confirmUpdateRepo = async () => await inquirer.prompt([{
  type: 'confirm',
  name: 'confirmUpdateRepo',
  message: `Do you want to update tags and refs to start the release?`
}]).then(next => next.confirmUpdateRepo)

const confirmNextVersionNumber = async version => await inquirer.prompt([{
  type: 'confirm',
  name: 'nextVersionConfirmation',
  message: `Your next version will be tagged as ${version}. Confirm?`
}]).then(next => next.nextVersionConfirmation)

const confirmPushRelease = async () => await inquirer.prompt([{
  type: 'confirm',
  name: 'pushReleaseConfirm',
  message: `Do you want to push the release to remote git now?`
}]).then(next => next.pushReleaseConfirm)

const confirmDevBranchName = async () => { 
  const questionsDevBranch = [{
    name: 'type',
    message: `What is your development branch name for ${workingDir}?`,
    name: 'devBranchName',
    type: 'list',
    choices: ['dev', 'develop', 'development' ]
  }]
  return await inquirer.prompt(questionsDevBranch)
}

const mountSummedVersionString = array => array.join('.')
const getVersionNumberParsed = line => {
  const regexVersion = /(\d+).(\d+).(\d+)/
  const version = regexVersion.exec(line);
  return version && version.slice(1, 4) || new Error("Wrong value provided for version string check\n\n")
}
const sumVersioningChanges = (lastVersionArray, type) => {
  let changed = false;
  let newVersionArray = [...lastVersionArray]
  let version = 0
  if (type.toLowerCase() === 'major') {
    version = parseInt(newVersionArray[0], 10) + 1
    newVersionArray[0] = version
    newVersionArray[1] = 0
    newVersionArray[2] = 0
    changed = true
  } else if (type.toLowerCase() === 'minor') {
    version = parseInt(newVersionArray[1], 10) + 1
    newVersionArray[1] = version
    newVersionArray[2] = 0
    changed = true
  } else if (type.toLowerCase() === 'patch') {
    version = parseInt(newVersionArray[2], 10) + 1
    newVersionArray[2] = version
    changed = true
  }
  if(!changed){
    throw new Error('Must provide a type for release in: [minor, major or patch]')
  }
  return mountSummedVersionString(newVersionArray)
}

const main = async () => {
  try {
    await stash()
    const confirmUpdateRepoInfo = await confirmUpdateRepo()
    if (confirmUpdateRepoInfo) {
      console.log('Updating...')
      await fetch()
      console.log('Updating tags...')
      await fetchTags()
      await goToBranch('master')
      console.log('Updating master...')
      await pull()
    }
    const devBranchNameInfo = await confirmDevBranchName()
    const branchName = devBranchNameInfo.devBranchName
    await goToBranch(branchName)
    console.log(`Updating ${branchName}...`)
    await pull()

    const lastReleaseInfo = await getlastRelease()
    const confirmNextVersionTypeInfo = await confirmNextVersionType()
    const summedVersionInfo = sumVersioningChanges(lastReleaseInfo.lastVersion, confirmNextVersionTypeInfo.type)

    await confirmNextVersionNumber(summedVersionInfo)
    const tagExistsInfo = await tagExists(summedVersionInfo)
    tagExistsInfo && console.error(chalk.red.bold(`❯ 💣 Failed because there is a tag with ${summedVersionInfo} name`))
    await releaseStart(summedVersionInfo)
    await changePackageJson(summedVersionInfo)
    await addPackageJson(summedVersionInfo)
    await commitPackageJson(summedVersionInfo)
    await releaseFinish(summedVersionInfo)

    const confirmPushReleaseInfo = await confirmPushRelease()
    !confirmPushReleaseInfo && console.warn(chalk.red.bold(`❯ 💣 You should then push the release manually with git push origin master && git push origin --tags`))
    if (confirmPushReleaseInfo) {
      console.log('Uploading dev...')
      await pushDev()
      console.log('Uploading master...')
      await pushMaster()
      console.log('Uploading tags...')
      await pushTags()
    }
    //access sites forcing new version
    //clean cached files
    //retest sites
  } catch(e) {
    console.log('==>', e)
  }
}

main()
