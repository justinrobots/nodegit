var nodegit = require("../");
var path = require("path");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
fse.ensureDir = promisify(fse.ensureDir);

var fileName = "newFile.txt";
var fileContent = "hello world";

var repoDir = "../../newRepo";

var repository;
var remote;

var signature = nodegit.Signature.create("Foo bar",
  "foo@bar.com", 123456789, 60);

// Create a new repository in a clean directory, and add our first file
fse.remove(path.resolve(__dirname, repoDir))
.then(function() {
  return fse.ensureDir(path.resolve(__dirname, repoDir));
})
.then(function() {
  return nodegit.Repository.init(path.resolve(__dirname, repoDir), 0);
})
.then(function(repo) {
  repository = repo;
  return fse.writeFile(path.join(repository.workdir(), fileName), fileContent);
})

// Load up the repository index and make our initial commit to HEAD
.then(function() {
  return repository.refreshIndex();
})
.then(function(index) {
  return index.addByPath(fileName)
    .then(function() {
      return index.write();
    })
    .then(function() {
      return index.writeTree();
    });
})

// Add a new remote
.then(function() {
  return nodegit.Remote.create(repository, "origin",
    "git@github.com:nodegit/push-example.git")
  .then(function(remoteResult) {
    remote = remoteResult;

    // Create the push object for this remote
    return remote.push(
      ["refs/heads/master:refs/heads/master"],
      {
        callbacks: {
          credentials: function(url, userName) {
            return nodegit.Cred.sshKeyFromAgent(userName);
          }
        }
      }
    );
  });
}).done(function() {
  console.log("Done!");
});
