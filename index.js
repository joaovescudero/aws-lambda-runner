#!/usr/bin/env node
'use strict'

const fs = require('fs')
const chalk = require('chalk')
const ls = require('log-symbols')
const CLI = require('clui'),
  Spinner = CLI.Spinner
const clear = require('clear')

// Global variables
clear()
const lambdaNames = []
const lambdaPaths = {}
const urlPaths = {}
const enviroment = 'dev'

// Create spinner
const baseSpinner = new Spinner('Starting aws lambda runner...', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'])
baseSpinner.start()

// Verify if config files exists
if (!fs.existsSync('.alr')) { baseSpinner.stop(); return console.log(ls.error, chalk.red('Directory .alr doesn\'t exists!')) }
if (!fs.existsSync('.alr/gateway.json')) { baseSpinner.stop(); return console.log(ls.error, chalk.red('API Gateway configuration file doesn\'t exists!')) }
if (!fs.existsSync('.alr/config.json')) { baseSpinner.stop(); return console.log(ls.error, chalk.red('Configuration file doesn\'t exists!')) }
console.log(chalk.green(ls.success, 'All configuration files found!'))

// Load gateway file
const gatewayConfig = require('./.alr/gateway')
baseSpinner.message(`Starting ${chalk.green(gatewayConfig.info.title)}@${chalk.red(gatewayConfig.info.version)}`)
console.log(chalk.green(ls.success, 'Gateway file loaded!'))

// Loading paths config from gateway file
Object.keys(gatewayConfig.paths).map(path => {
  Object.keys(gatewayConfig.paths[path]).map(method => {
    if (method === 'options') return false
    const {
      produces: contentTypes,
      responses,
      'x-amazon-apigateway-integration': {
        uri,
        type: integrationType,
      },
      parameters
    } = gatewayConfig.paths[path][method]

    const lambdaUri = uri.split(':')[11].split('/')[0]
    if (!lambdaNames.includes(lambdaUri)) lambdaNames.push(lambdaUri)

    urlPaths[path] = {
      method: method === 'x-amazon-apigateway-any-method' ? 'ANY' : method.toUpperCase(),
      contentTypes,
      responsesCode: Object.keys(responses),
      lambdaUri,
      integrationType,
      parameters
    }
  })
})
console.log(chalk.green(ls.success, 'All paths loaded!'))

// Load config file
const configFile = require('./.alr/config')
console.log(chalk.green(ls.success, 'Configuration file loaded!'))


// Setting lambdas paths
lambdaNames.map(name => {
  let self = name

  if (!name.includes('${stageVariables.'))
    configFile.lambdaMameMappingRemove.map(remove => {
      name = name.replace(remove, '')
      lambdaPaths[self] = `${configFile.functionsDirectories}${name}.js`
    })

  Object.keys(configFile.stages[enviroment].stageVariables).map(variable => {
    let varName = configFile.stages[enviroment].stageVariables[variable]
    configFile.lambdaMameMappingRemove.map(remove => {
      varName = varName.replace(remove, '')
      // console.log(self)
      lambdaPaths['${stageVariables.'+variable+'}'] = `${configFile.functionsDirectories}${varName}.js`
    })
  })
})
console.log(chalk.green(ls.success, 'All lambdas paths set!'))

// Loading all lambdas
Object.keys(lambdaPaths).map(path => {
   const lambda = require(`./${lambdaPaths[path]}`)
  lambdaPaths[path] = lambda.handler
})
console.log(chalk.green(ls.success, 'All lambdas loaded!'))

// Adding each lambda on each url
Object.keys(urlPaths).map(url => {
  urlPaths[url].lambda = lambdaPaths[urlPaths[url].lambdaUri]
})
console.log(chalk.green(ls.success, 'Added all lambda on each url with success!'))
console.log(urlPaths)
