import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
export function probePort(port=8001,host='127.0.0.1'){
 return new Promise(resolve=>{
  const server=createServer();
  server.once('error',error=>resolve({ok:false,code:error.code??'UNKNOWN'}));
  server.listen({port,host,exclusive:true},()=>server.close(error=>resolve(error?{ok:false,code:error.code??'UNKNOWN'}:{ok:true})));
 });
}
export function portMessage(result,port=8001){
 if(result.ok)return '';
 if(result.code==='EADDRINUSE')return `Port ${port} is already in use. A server may already be running.\nCheck http://localhost:${port}/ in your browser. If it is another server, stop it manually.\nPowerShell: Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object OwningProcess\nNo process was stopped. The port was not changed to protect browser progress.`;
 return `Cannot bind 127.0.0.1:${port} (${result.code}). Check local firewall or permissions. No process was stopped.`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=await probePort();if(!result.ok){console.error(portMessage(result));process.exitCode=1;}}
