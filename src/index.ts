import * as core from '@actions/core';
import * as github from '@actions/github';

const end_time = new Date().toTimeString();
console.log(`Ended at ${end_time}`);
core.setOutput('end_time', end_time);

const actionName = core.getInput('action_name');
console.log(`Hello from ${actionName}`);

const payload = JSON.stringify(github.context.payload);
console.log(`The event payload: ${payload}`);


const context = JSON.stringify(github.context.payload);
console.log(`The event context: ${context}`);
