// import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

// interface ActionContext {
//   action_name: string;
//   actor: string;
//   repo_name: string;
//   action_version: Promise<string>;
//   start_time: string;
//   end_time: string;
//   workflow_name: string;
//   workflow_file: string;
//   workflow_trigger: string;
//   job_name: string;
//   sha: string;
//   repo_ref: string;
//   run_url: string;
// }

const gh_token = process.env.GH_TOKEN;

// const actionStartTime = core.getInput("start_time");
// const actionEndTime = new Date().toTimeString();
// const actionName = core.getInput("action_name");

const context = JSON.parse(JSON.stringify(github.context));

// create var of type ActionContext
// const actionContext: ActionContext = {
//   action_name: actionName,
//   actor: context.actor,
//   repo_name: context.payload.repository.name,
//   action_version: getActionVersion(),
//   start_time: actionStartTime,
//   end_time: actionEndTime,
//   workflow_name: context.workflow,
//   workflow_file: context.payload.repository.workflow,
//   workflow_trigger: context.eventName,
//   job_name: context.job,
//   sha: context.sha,
//   repo_ref: context.ref,
//   run_url: `${context.payload.repository.html_url}/actions/runs/${context.runId}`,
// };

getActionVersion();

async function getActionVersion(): Promise<any>/*: Promise<string>*/ {
  console.log("Getting action version");
  const wf_path = context.payload.workflow;

  try {
    const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/${wf_path}`;
    console.log(`url: ${url}`);

    const response = await axios.get(url, {
        headers: {
          content: 'application/json',
          accept: 'application/vnd.github.VERSION.raw',
          Authorization: `Bearer ${gh_token}`,
        },
    });

    // const actionArray: string[] = response.data.split(" ");

    console.log(response.data);

    // TODO: Parse the content to get the version ov action (can use action name to match file line)

    // Return the version
    // return response.body;
  } catch (error) {
    console.log(error);
    return "Failed to get version";
  }
}

// TO-DO - send to micro-service
// Will need eventhub name and data in call
// Url might be an input to this action

// console.log(`Parsed Context: ${JSON.stringify(actionContext, null, 2)}`);
