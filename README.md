# Releaser
> Its is a simple tool to help deploy NodeJS projects that uses **gitflow**

![](print.png)

## Installation

OS X & Linux:

```sh
yarn
```

## Usage example

node index **absolute path of git repository]**

### Example

node index **/$USER/project-path**

## Development setup

To do.

Use a docker image to be used as your local github https://hub.docker.com/r/winlu/docker-git-server/ and point
your origin or upstream at `.git/config` with:
```sh
[remote "origin"]
url = ssh://localhost:1234/~/my_repo.git
fetch = +refs/heads/*:refs/remotes/origin/*
```

```sh
yarn
```

## Release History

* 0.0.1
  * Template support