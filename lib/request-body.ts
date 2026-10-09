const MAX_BODY_BYTES = 5000;

export class RequestBodyError extends Error {
  constructor(message:string,public readonly status:number) { super(message); }
}

export async function readBoundedJson(request:Request):Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestBodyError("Envía la solicitud en formato JSON.",415);
  }
  const declaredLength=Number(request.headers.get("content-length"));
  if (declaredLength>MAX_BODY_BYTES) throw new RequestBodyError("Solicitud demasiado grande.",413);
  if (!request.body) throw new RequestBodyError("Solicitud no válida.",400);
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let bytes=0,text="";
  try {
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      bytes+=value.byteLength;
      if (bytes>MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestBodyError("Solicitud demasiado grande.",413);
      }
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}
