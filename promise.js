
function Promise (executor) {   
  let self = this;
  self.status = 'pending';
  self.value = undefined;    
  self.reason = undefined;
  self.onResolvedCallbacks = [];   
  self.onRejectedCallbacks = [];   
  function resolve(value) {
      if(self.status === 'pending') {
          self.status = 'resolved';
          self.value = value;
          self.onResolvedCallbacks.forEach(function(fn) {  
              fn();
          })
      }
  }
  function reject(reason) {
      if(self.status === 'pending') {
          self.status = 'rejected';
          self.reason = reason;
          self.onRejectedCallbacks.forEach(function(fn) {  
              fn();
          })
      }
  }
  try {
      executor(resolve, reject);   
  } catch (e) {  
      reject(e);                 
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  
  if(promise2 === x) {
      return reject(new TypeError('循环引用'));
  }
 
  let called;  
  if (x!== null && (typeof x ==='object' ||typeof x === 'function')) {
     
      try {
          let then = x.then;
          if (typeof then === 'function') {
              //成功
              then.call(x, function(y) {
                  if (called) return       
                  called = true;
                  resolvePromise(promise2, y, resolve, reject)
              }, function(err) {
                  if (called) return
                  called = true;
                  reject(err);
              })
          } else {
              resolve(x)             
          }
      } catch (e) {
          if (called) return
          called = true;
          reject(e)
      }
      
  } else {  
      return resolve(x)
  }

}

Promise.prototype.then = function (onFulfiled, onRejected) {
  
  onFulfiled = typeof onFulfiled === 'function'? onFulfiled:value=>value
  onRejected = typeof onRejected === 'function'? onRejected:function(err) {
      throw err;
  }
  let self = this;
  let promise2;  //链式调用
  if(self.status === 'resolved') {
      promise2 = new Promise(function(resolve, reject){  
          setTimeout(function(){                         
              try {
                  let x = onFulfiled(self.value);                                   
                  resolvePromise(promise2, x, resolve, reject) 
              } catch (e) {
                  reject(e);                                        
              }
              
          }) 
      }) 
  }
  if(self.status === 'rejected') {
      promise2 = new Promise(function(resolve, reject){
          setTimeout (function() {
              try {
                  let x = onRejected(self.reason);
                  resolvePromise(promise2, x, resolve, reject)
              } catch (e) {
                  reject(e);
              }
          })
      }) 
  }
  
  if(self.status === 'pending') {            
      promise2 = new Promise (function(resolve, reject) {   
          self.onResolvedCallbacks.push(function(){   
              setTimeout(function(){
                  try {
                      let x = onFulfiled(self.value); 
                      resolvePromise(promise2, x, resolve, reject)
                  } catch (e) {
                      reject(e);
                  }   
              })
          });
          self.onRejectedCallbacks.push(function(){
              setTimeout(function(){
                  try {
                      let x = onRejected(self.reason);
                      resolvePromise(promise2, x, resolve, reject)
                  } catch (e) {
                      reject(e);
                  } 
              })   
          });
      })
  }
  return promise2;
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
}
Promise.all = function (promises) {
  return new Promise(function (resolve, reject) {
    let result = [];
    let count = 0;
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(function (data) {
        result[i] = data;
        if (++count == promises.length) {
          resolve(result);
        }
      }, function (err) {
        reject(err);
      });
    }
  });
}

try {
  module.exports = Promise
} catch (e) {
}
