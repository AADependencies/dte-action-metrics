/* eslint-disable no-prototype-builtins */
import * as github from '@actions/github';
import axios from 'axios';
import YAML from 'yaml';

type ActionContext = {
  action_name: string | undefined;
  actor: string;
  repo_name: string;
  action_version: string;
  start_time: string | undefined;
  end_time: string | undefined;
  workflow_name: string;
  workflow_file: string;
  workflow_trigger: string;
  job_name: string;
  sha: string;
  repo_ref: string;
  run_url: string;
};

const gh_token = process.env.GH_TOKEN;
const actionStartTime = new Date(String(process.env.START_TIME));
const actionEndTime = new Date();
const actionName = process.env.ACTION_NAME;
const actionURL = process.env.ACTION_URL;

const context = JSON.parse(JSON.stringify(github.context));

async function getActionContext(): Promise<ActionContext> {
  const wf_file = context.payload.workflow
    ? context.payload.workflow
    : await getWorkflowFile(context.workflow);

  return {
    action_name: actionName,
    actor: context.actor,
    repo_name: context.payload.repository.name,
    action_version: await getActionVersion(wf_file),
    start_time: actionStartTime.toLocaleString("en-US", {
      timeZone: "America/Chicago",
    }),
    end_time: actionEndTime.toLocaleString("en-US", {
      timeZone: "America/Chicago",
    }),
    workflow_name: context.workflow,
    workflow_file: wf_file.split("/").pop(),
    workflow_trigger: context.eventName,
    job_name: context.job,
    sha: context.sha,
    repo_ref: context.ref,
    run_url: `${context.payload.repository.html_url}/actions/runs/${context.runId}`,
  };
}

async function getWorkflowFile(workflow_name: string): Promise<string> {
  const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/.github/workflows`;
  const response = await axios.get(url, {
    headers: {
      content: "application/json",
      accept: "application/vnd.github.VERSION.raw",
      Authorization: `Bearer ${gh_token}`,
    },
  });

  const files_object = response.data;

  for (const file of files_object) {
    try {
      const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/${file.path}`;
      const response = await axios.get(url, {
        headers: {
          content: "application/json",
          accept: "application/vnd.github.VERSION.raw",
          Authorization: `Bearer ${gh_token}`,
        },
        params: {
          ref: context.ref,
        },
      });

      if (response.data.indexOf(workflow_name) !== -1) {
        return file.path;
      }
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

  return "N/A";
}

async function getActionVersion(wf_path: string): Promise<string> {
  try {
    // const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/${wf_path}`;
    const url = `https://api.github.com/repos/${context.payload.organization.login}/${context.payload.repository.name}/contents/${wf_path}`;

    const response = await axios.get(url, {
      headers: {
        content: "application/json",
        accept: "application/vnd.github.VERSION.raw",
        Authorization: `Bearer ${gh_token}`,
      },
      params: {
        ref: context.ref,
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
    eventhub_name: "github_actions_prod",
    data: await getActionContext(),
  };

  const request = await axios.post(actionURL as string, actionContextData, {
    headers: {
      content: "application/json",
      Authorization: `Bearer ${gh_token}`,
    },
  });

  return request;
}

async function printRequest() {
  console.log(await sendDataToADXSender());
}

printRequest();

