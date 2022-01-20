/* eslint-disable no-prototype-builtins */
import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';
import YAML from 'yaml';

type ActionContext = {
  action_name: string;
  actor: string;
  repo_name: string;
  action_version: string;
  start_time: string;
  end_time: string;
  workflow_name: string;
  workflow_file: string;
  workflow_trigger: string;
  job_name: string;
  sha: string;
  repo_ref: string;
  run_url: string;
}

const gh_token = process.env.GH_TOKEN;

const actionStartTime = core.getInput("start_time");
const actionEndTime = new Date().toTimeString();
const actionName = core.getInput("action_name");


const context = JSON.parse(JSON.stringify(github.context));

async function getActionContext() : Promise<ActionContext> {
  return {
    action_name: actionName,
    actor: context.actor,
    repo_name: context.payload.repository.name,
    action_version: await getActionVersion(),
    start_time: actionStartTime,
    end_time: actionEndTime,
    workflow_name: context.workflow,
    workflow_file: context.payload.repository.workflow,
    workflow_trigger: context.eventName,
    job_name: context.job,
    sha: context.sha,
    repo_ref: context.ref,
    run_url: `${context.payload.repository.html_url}/actions/runs/${context.runId}`,
  };
}


async function getActionVersion(): Promise<string> {
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

    const doc = YAML.parseDocument(response.data);

    const steps = doc.contents?.toJSON().jobs[context.job].steps;
    // const targetRepo = "AAInternal/" + actionName;
    const targetRepo = "AAInternal/sonarscan";   

    for(const step of Object.keys(steps)) {
      const stepWith = steps[step].hasOwnProperty('with') ? steps[step].with : null;
      if(stepWith !== null) {
        const stepRepo = stepWith.hasOwnProperty('repository') ? stepWith.repository : null;
        if(stepRepo === targetRepo && stepWith.hasOwnProperty('ref')) {
          return stepWith.ref;
        }
      } else {
        continue;
      }
    }

    return "VERSION NOT FOUND";
  } catch (error) {
    console.log(error);
    return "Failed to get version";
  }
}

// TO-DO - send to micro-service
// Will need eventhub name and data in call
// Url might be an input to this action
async () => {
  console.log(await getActionContext());
}

