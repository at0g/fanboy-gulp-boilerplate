module.exports = function(path, context){
    return '/' + context.data.root[path];
};