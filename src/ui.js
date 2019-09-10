'use strict'

const Inquirer = require('inquirer')
const Table = require('easy-table')
const Ora = require('ora')

exports.prompt = function (questions) {
  return Inquirer.prompt(questions)
}

exports.confirm = function (msg) {
  return this.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message: msg
    }
  ]).then(answer => answer.ok)
}

exports.list = function (msg, choices, defaultVal) {
  return this.prompt([
    {
      type: 'list',
      name: 'result',
      message: msg,
      choices: choices, // -> [{name, value, short}]
      default: defaultVal
    }
  ]).then(answer => answer.result)
}

exports.checkbox = function (msg, choices, defaultVal) {
  return this.prompt([
    {
      type: 'checkbox',
      name: 'result',
      message: msg,
      choices: choices // -> [{name, value, short, checked}]
    }
  ]).then(answer => answer.result)
}

exports.input = function (msg, defaultVal) {
  return this.prompt([
    {
      type: 'input',
      name: 'result',
      message: msg,
      default: defaultVal
    }
  ]).then(answer => answer.result)
}

exports.editor = function (msg) {
  return this.prompt([
    {
      type: 'editor',
      name: 'result',
      message: msg
    }
  ]).then(answer => answer.result)
}

exports.table = function (rows) {
  var t = new Table()
  rows.forEach(row => {
    for (let k in row) {
      t.cell(k, row[k])
    }
    t.newRow()
  })
  return t.toString()
}

exports.spinner = function (desc) {
  return Ora(desc).start()
}

exports.colors = require('colors/safe')

exports.boxen = function (input, opts) {
  return require('boxen')(input, opts || {})
}

exports.marked = function (text) {
  const marked = require('marked')
  const renderer = new (require('./library/marked-terminal'))({
    tab: 2,
    showSectionPrefix: false
  })
  marked.setOptions({ renderer: renderer })
  return marked(text)
}
