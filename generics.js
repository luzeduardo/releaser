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

const readTemplate = async (template) => {
  return await fs.readFile(template)
}

module.exports = {
  mountSummedVersionString,
  getVersionNumberParsed,
  sumVersioningChanges,
  readTemplate
}
