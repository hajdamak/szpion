# Szpion 

Daily sprint invigilation tool.

[![Build Status](https://travis-ci.org/rhajdacki/szpion.svg?branch=master)](https://travis-ci.org/rhajdacki/szpion)
[![Code Coverage](https://codecov.io/github/rhajdacki/szpion/branch/master/graph/badge.svg)](https://codecov.io/github/rhajdacki/szpion)
 
Szpion connects to JIRA and provides additional web based reports for sprints.

## Usage

Place configuration file `szpion.json` in directory where Szpion executable is located 
or `~/.config/szpion/szpion.json` and configure JIRA's URL and HTTP Basic auth:  

    {
	    "jiraURL": "localhost",
	    "jiraBasicAuthToken": "token content",
	    "clientConfig": {}
    }

Execute application binary:

    ./szpion

Szpion is accessible in browser under `http://localhost:8080`.

## Development

Download dependencies:

    npm install

Start application in development mode with hot reload (accessible on 
`http://localhost:8080`):

    npm run start

and additionally with JIRA mocked using static files from `source/test/jira-mock-data`
 directory:

    npm run start:mock

Start application in production mode as self contained Linux x64 executable generated
 in `target/prod/szpion`:

    npm run start:prod

or only generate it:

    npm run build

Run tests:

    npm run test

Run tests in watch mode:

    npm run test:watch

Clean all generated files:

    npm run clean

## Author

- Rafał Hajdacki <rafal@hajdacki.com>

## License

MIT

