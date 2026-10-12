const fs = require('fs');

function fixError(err, path) {
  if (err && (err.code === 'EISDIR' || err.code === 'EINVAL')) {
    const e = new Error(`EINVAL: invalid argument, readlink '${path}'`);
    e.code = 'EINVAL';
    e.syscall = 'readlink';
    e.path = path;
    return e;
  }
  return err;
}

const origReadlink = fs.readlink;
if (origReadlink) {
  fs.readlink = function (path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return origReadlink.call(fs, path, options, (err, linkString) => {
      if (err) return callback(fixError(err, path));
      return callback(null, linkString);
    });
  };
}

const origReadlinkSync = fs.readlinkSync;
if (origReadlinkSync) {
  fs.readlinkSync = function (path, options) {
    try {
      return origReadlinkSync.call(fs, path, options);
    } catch (err) {
      throw fixError(err, path);
    }
  };
}

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (path, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, options);
    } catch (err) {
      throw fixError(err, path);
    }
  };
}
