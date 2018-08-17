#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const CLI = require('clui'),
  Spinner = CLI.Spinner
require('clear')()

// Create spinner
const baseSpinner = new Spinner('Starting aws lambda runner...', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'])
baseSpinner.start()

// Verify if config files exists

if (!fs.existsSync('.alr')) { baseSpinner.stop(); return console.log(chalk.red('Directory .alr doesn\'t exists')) }
if (!fs.existsSync('.alr/gateway.json')) { baseSpinner.stop(); return console.log(chalk.red('API Gateway config file doesn\'t exists')) }
if (!fs.existsSync('.alr/config.json')) { baseSpinner.stop(); return console.log(chalk.red('Config file doesn\'t exists')) }

// Load gateway file
const gatewayConfig = require('./.alr/gateway')
baseSpinner.message(`Starting ${chalk.green(gatewayConfig.info.title)}@${chalk.red(gatewayConfig.info.version)}`)