module.exports = function(path, context){
    if(!context.data.root[path]){
        return path;
    }
    return '/' + context.data.root[path];
};