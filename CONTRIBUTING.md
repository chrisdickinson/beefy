# Contributing to B E E F Y

## Opening an Issue

Have a great idea for a new feature? Or a bug you'd like to be quashed? Report it as an issue!
Make sure you include the following information, in the case of bugs:

1. The version of beefy you're running.
2. The version of node you're running.
3. What happened, and how it differed from your expectations.
4. Ideally, a reproducible test case.

## Developing: Getting Started 

* Make sure you have Node >= 0.10 installed. You can grab that [here](http://nodejs.org/).
* Clone the repo from Github.
* In your checkout, run `npm install`.
* Run `npm test`. If this succeeds, you should see `# ok` as one of the last lines of output.
* To lint, run `./node_modules/.bin/jsl <file>`. The linter runs as part of the test suite.
* For code coverage, run `npm run test-cov`.

## Making a Pull Request

Make sure you've added **tests** and **documentation**, where appropriate, and that the former
is passing.

If you have **any** questions, drop by `#pdxnode` on irc.freenode.net 
and mention that you're working on beefy. There are many helpful folks in there! If you're not
on IRC, feel free to email [@chrisdickinson](mailto:chris@neversaw.us) with your questions.

## finally...

Thanks for contributing to Beefy!
