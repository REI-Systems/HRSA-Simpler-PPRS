# How to Contribute as an External Contributor

🎉 First off, thanks for taking the time to contribute! 🎉

We encourage you to read this project's contributing guide (you are here), its [LICENSE](LICENSE.md), and its [README](README.md).

## How Can I Contribute?

There are a number of ways to contribute to this project.

### Report a Bug

If you think you have found a bug in the code or static site, [search our issues list](https://github.com/REI-Systems/HRSA-Simpler-PPRS/issues) on GitHub for any similar bugs. If you find a similar bug, please update that issue with your details.

If you do not find your bug in our issues list, file a bug report. When reporting the bug, please follow these guidelines:

- **Please use the issue template** This is populated with information and questions that will help grants.gov developers resolve the issue with the right information
- **Use a clear and descriptive issue title** for the issue to identify the problem.
- **Describe the exact steps to reproduce the problem** in as much detail as possible. For example, start by explaining how you got to the page where you encountered the bug and what you were attempting to do when the bug occurred.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** if possible, which show you following the described steps and clearly demonstrate the problem.
- **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened.

### Suggest an Enhancement

If you don't have specific language or code to submit but would like to suggest a change, request a feature, or have something addressed, you can open an issue in this repository.

In this issue, please describe the use case for the feature you would like to see -, what you need, why you need it, and how it should work. Team members will respond to the Feature request as soon as possible. Often, Feature request suggestions undergo a collaborative discussion with the community to help refine the need for the feature and how it can be implemented.

### Non-Technical Contributions

#### Documentation

To contribute to documentation you find in this repository, feel free to use the GitHub user interface to submit a pull request for your changes. Find more information about using the GitHub user interface for PRs here.

### Contribute to community discussions

> 🚧 Tools and expanding avenues for community engagement are coming soon.

### Sharing your story

Sharing how you or your organization have used the Simpler Grants project is an important way for us to raise awareness about the project and its impact. Please tell us your story by [sending us an email at `simpler-grants-gov@hhs.gov`](mailto:simpler-grants-gov@hhs.gov).

## Code Contributions

The following guidelines are for code contributions. Please see [DEVELOPMENT.md](./DEVELOPMENT.md) for more information about the software development lifecycle on the project.

### Getting Started

This project is a monorepo with a **backend** (Python/Flask) and **frontend** (Next.js). For local setup:

- **[README](README.md)** — Quick start and detailed local setup (backend + frontend)
- **[wiki/Getting-Started](wiki/Getting-Started.md)** — Prerequisites and step-by-step setup
- **[deployment/local/README](deployment/local/README.md)** — Scripts and Docker-based local development

See the [wiki](wiki/) for Architecture, Backend, Frontend, Database, API Reference, and Deployment, and the [docs](docs/) folder for design and migration notes.

### Workflow and Branching

This project follows [trunk-based development](./DEVELOPMENT.md#branching-model), so all contributions are directed toward the `main` branch.

1.  Fork the project
1.  Check out the `main` branch
1.  Create a feature branch
1.  Write code and tests for your change
1.  From your branch, make a pull request against `main` on [REI-Systems/HRSA-Simpler-PPRS](https://github.com/REI-Systems/HRSA-Simpler-PPRS)
1.  Work with repo maintainers to get your change reviewed
1.  Wait for your change to be merged into `main`
1.  Delete your feature branch

### Testing, Coding Style and Linters

Each application has its own testing and linters. Every commit is tested to adhere to tests and the linting guidelines. It is recommended to run tests and linters locally before committing.

### Issues

External contributors should use the _Bug Report_ or _Feature Request_ 

### Pull Requests

Pull requests should follow the conventions in [DEVELOPMENT.md](./DEVELOPMENT.md) with the following changes:

1. Pull requests should be titled with `[Issue N] Description`. However if there is no issue, use `[External] Description` format.
1. External contributors can't merge their own PRs, so an internal team member will pull in after changes are satisfactory.

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.
