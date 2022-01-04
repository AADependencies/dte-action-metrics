import * as core from '@actions/core';
// import github from '@actions/github';

const actionName = core.getInput('action_name');

console.log(`Hello from ${actionName}`);
