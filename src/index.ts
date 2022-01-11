import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import base64 from 'base64-js';

interface ActionContext {
  action_name: string,
  actor: string;
  repo_name: string;
  action_version: Promise<string>,
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

console.log("Hello World");
console.log(`Token: ${process.env.GITHUB_TOKEN}`);

const gh_token = process.env.GH_TOKEN;

const gh = new Octokit({auth: gh_token});

const actionStartTime = core.getInput("start_time");

const actionEndTime = new Date().toTimeString();

const actionName = core.getInput("action_name");

const context = JSON.parse(JSON.stringify(github.context));


// create var of type ActionContext
const actionContext: ActionContext = {
  action_name: actionName,
  actor: context.actor,
  repo_name: context.payload.repository.name,
  action_version: getActionVersion(),
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

async function getActionVersion(): Promise<string> {

  console.log("Getting action version");
  console.log(`Path: ${context.payload.workflow}`);
  const wf_path = context.payload.workflow;
  console.log(`wf_path: ${wf_path}`);

  try {
    const response = await gh.request(
      "GET /repos/{owner}/{repo}/contents/.github/workflows/test-action-from-repo.yml",
      {
        owner: context.payload.organization.login,
        repo: context.payload.repository.name,
        // path: ".github/workflows/test-action-from-repo.yml",
      }
    );

    const content = base64.toByteArray(response.data.content);
    console.log(`Content Decoded: ${content}`);
    console.log(`Content toString: ${content.toString()}`);
    return content.toString();
  } catch (error) {
    console.log(error);
    return "Failed to get version";
  }
}


console.log(`Parsed Context: ${JSON.stringify(actionContext, null, 2)}`);
