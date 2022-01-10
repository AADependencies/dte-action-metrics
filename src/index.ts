import * as core from '@actions/core';
import * as github from '@actions/github';

interface ActionContext {
  name: string;
  actor: string;
  repo_name: string;
  start_time: string;
  end_time: string;
  workflow_name: string;
  workflow_file: string;
  workflow_trigger: string;
  job_name: string;
  // end_status: string;
  // os: string;
  sha: string;
  repo_ref: string;
  // version: string;
  run_url: string;
}

const action_start_time = core.getInput("start_time");
console.log(`Stated at: ${action_start_time}`);

const action_end_time = new Date().toTimeString();
console.log(`Ended at: ${action_end_time}`);

const actionName = core.getInput("action_name");
console.log(`Action Name: ${actionName}`);

console.log(`Action Context: ${JSON.stringify(github.context, null, 2)}`);
const context = JSON.parse(JSON.stringify(github.context));


// create var of type ActionContext
const actionContext: ActionContext = {
  name: actionName,
  repo_name: context.payload.repository.name,
  actor: context.actor,
  start_time: action_start_time,
  end_time: action_end_time,
  workflow_name: context.workflow,
  workflow_file: context.payload.repository.workflow,
  workflow_trigger: context.eventName,
  job_name: context.job,
  // end_status: context.state,
  // os: context.event_type,
  sha: context.sha,
  repo_ref: context.ref,
  // version: context.event_type,
  run_url: `${context.payload.repository.html_url}/actions/runs/${context.run_id}`,
};

console.log(`Parsed Context: ${JSON.stringify(actionContext, null, 2)}`);
