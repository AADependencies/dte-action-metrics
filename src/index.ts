/* eslint-disable no-prototype-builtins */
import * as github from '@actions/github';
import axios from 'axios';
import YAML from 'yaml';

type ActionContext = {
  action_name: string | undefined;
  actor: string;
  repo_name: string;
  action_version: string;
  start_time: Date | undefined;
  end_time: Date;
  workflow_name: string;
  workflow_file: string;
  workflow_trigger: string;
  job_name: string;
  sha: string;
  repo_ref: string;
  run_url: string;
}

const gh_token = process.env.GH_TOKEN;
const actionStartTime = new Date(String(process.env.START_TIME));
const actionEndTime = new Date();
const actionName = process.env.ACTION_NAME;
const actionURL = process.env.ACTION_URL;

const context = JSON.parse(JSON.stringify(github.context));

async function getActionContext(): Promise<ActionContext> {
  console.log("Context: " + JSON.stringify(context, null, 2));

  return {
    action_name: actionName,
    actor: context.actor,
    repo_name: context.payload.repository.name,
    action_version: await getActionVersion(),
    start_time: actionStartTime,
    end_time: actionEndTime,
    workflow_name: context.workflow,
    workflow_file: context.payload.workflow
      ? context.payload.workflow.split("/").pop()
      : await getWorkflowFile(context.workflow),
    workflow_trigger: context.eventName,
    job_name: context.job,
    sha: context.sha,
    repo_ref: context.ref,
    run_url: `${context.payload.repository.html_url}/actions/runs/${context.runId}`,
  };
}

async function getWorkflowFile(workflow_name: string) {
  console.log("No workflow file in context. Extracting from GitHub");

  const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/.github/workflows`;
  const response = await axios.get(url, {
    headers: {
      content: "application/json",
      accept: "application/vnd.github.VERSION.raw",
      Authorization: `Bearer ${gh_token}`,
    },
  });

  console.log(`Response.data: ${response.data}`);
  console.log(`Response.data as JSON: ${JSON.stringify(response.data)}`);

  const files_object = response.data;

  for (const file of files_object) {
    try {
      console.log(`Checking file: ${file.name}`);

      const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/${file.path}`;
      const response = await axios.get(url, {
        headers: {
          content: "application/json",
          accept: "application/vnd.github.VERSION.raw",
          Authorization: `Bearer ${gh_token}`,
        },
      });

      if (response.data.indexOf(workflow_name) !== -1) {
        console.log(`Found workflow file: ${file.name} at path ${file.path}`);
        return file.path;
      }
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

  return "N/A";
}

async function getActionVersion(): Promise<string> {
  console.log("Getting action version");
  const wf_path = context.payload.workflow
    ? context.payload.workflow
    : await getWorkflowFile(context.workflow);
  console.log("wf_path:" + wf_path);

  try {
    // Need to add ref query so that we are not extracting version from default branch https://docs.github.com/en/rest/reference/repos#get-repository-content
    const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/${wf_path}`;

    const response = await axios.get(url, {
      headers: {
        content: "application/json",
        accept: "application/vnd.github.VERSION.raw",
        Authorization: `Bearer ${gh_token}`,
      },
    });

    const doc = YAML.parseDocument(response.data);

    const steps = doc.contents?.toJSON().jobs[context.job].steps;
    const targetRepo = "AAInternal/" + actionName;

    for (const step of Object.keys(steps)) {
      const stepWith = steps[step].hasOwnProperty("with")
        ? steps[step].with
        : null;
      if (stepWith !== null) {
        const stepRepo = stepWith.hasOwnProperty("repository")
          ? stepWith.repository
          : null;
        if (stepRepo === targetRepo) {
          if (stepWith.hasOwnProperty("ref")) {
            return stepWith.ref;
          } else {
            return "default branch";
          }
        }
      } else {
        continue;
      }
    }

    return "N/A";
  } catch (error) {
    console.log(error);
    return "Failed to get version";
  }
}

async function sendDataToADXSender() {
  const actionContextData = {
    eventhub_name: "github_actions",
    data: await getActionContext(),
  };
  console.log(`Context Data: ${actionContextData}`);

  const request = await axios.post(actionURL as string, actionContextData, {
    headers: {
      content: "application/json",
      Authorization: `Bearer ${gh_token}`,
    },
    // data: {
    //   "eventhub_name": "github_actions",
    //   "data": actionContextData
    // }
  });

  return request;
}

async function printRequest() {
  console.log(await sendDataToADXSender());
}

printRequest();

