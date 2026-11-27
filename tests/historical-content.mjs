// Historical release checks must verify original bytes, not require an immutable live course.
// v0.36 tests separately verify that all released graded items survive migration unchanged.
import {readFile} from 'node:fs/promises';
export async function historicalContent(path){
 if(!/^content\/(lessons|modules)\/[a-z0-9-]+\.json$/.test(path))throw Error('Unexpected historical path '+path);
 try{return await readFile(new URL('./fixtures/v035/'+path,import.meta.url))}catch(e){if(e.code!=='ENOENT')throw e;return readFile(new URL('../'+path,import.meta.url))}
}
