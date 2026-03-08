var HearingSDK=function(c){"use strict";class p{constructor(t,n=!1){this.supabaseUrl=t,this.debug=n}log(...t){this.debug&&console.log("[HearingSDK]",...t)}async getContext(t){try{const n=`${this.supabaseUrl}/functions/v1/sdk-context?sessionId=${t}`;this.log("Fetching context:",n);const s=await fetch(n,{method:"GET",headers:{"Content-Type":"application/json"}});if(!s.ok){const o=await s.json();return this.log("Context error:",o),null}const i=await s.json();return this.log("Context received:",i),i}catch(n){return this.log("Context fetch failed:",n),null}}async ingestEvents(t,n){if(n.length===0)return{success:!0,inserted:0};try{const s=`${this.supabaseUrl}/functions/v1/sdk-ingest-events`;this.log("Ingesting events:",n.length);const i=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:t,events:n})});if(!i.ok){const a=await i.json();return this.log("Ingest error:",a),null}const o=await i.json();return this.log("Ingest success:",o),o}catch(s){return this.log("Ingest failed:",s),null}}async markReturned(t,n,s){try{const i=`${this.supabaseUrl}/functions/v1/sdk-mark-returned`;this.log("Marking returned");const o=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:t,pageUrl:n,elapsedMs:s})});if(!o.ok){const l=await o.json();return this.log("Mark returned error:",l),null}const a=await o.json();return this.log("Mark returned success:",a),a}catch(i){return this.log("Mark returned failed:",i),null}}}function f(e,t){return function(s){var l;const i=s.target;if(!i)return;let o=i.tagName.toLowerCase();if(i.id)o=`#${i.id}`;else if(i.className&&typeof i.className=="string"){const d=i.className.trim().split(/\s+/).slice(0,3).join(".");d&&(o=`${o}.${d}`)}const a={eventType:"click",targetSelector:o,pageUrl:window.location.href,pageTitle:document.title,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,xPosition:Math.round(s.clientX),yPosition:Math.round(s.clientY),elapsedMs:t(),timestamp:new Date().toISOString(),metadata:{tagName:i.tagName,innerText:(l=i.innerText)==null?void 0:l.slice(0,100),href:i instanceof HTMLAnchorElement?i.href:void 0}};e(a)}}function m(e,t){let n=0,s=null;return function(){s&&clearTimeout(s),s=setTimeout(()=>{const o=window.scrollY||document.documentElement.scrollTop,a=document.documentElement.scrollHeight,l=document.documentElement.clientHeight,d=Math.round((o+l)/a*100/10)*10;if(d>n){n=d;const T={eventType:"scroll",pageUrl:window.location.href,pageTitle:document.title,scrollDepth:d,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,elapsedMs:t(),timestamp:new Date().toISOString()};e(T)}},100)}}function w(e,t){return function(){const s={eventType:"visibility_change",pageUrl:window.location.href,pageTitle:document.title,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,elapsedMs:t(),timestamp:new Date().toISOString(),metadata:{visibilityState:document.visibilityState,hidden:document.hidden}};e(s)}}const v=`
.hearing-sdk-recording-indicator {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999999;
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.95);
  color: white;
  border: none;
  border-radius: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  pointer-events: none;
}

.hearing-sdk-recording-indicator__dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: hearing-sdk-recording-blink 1s infinite;
}

@keyframes hearing-sdk-recording-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.hearing-sdk-floating-button {
  position: fixed;
  z-index: 999999;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hearing-sdk-floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(99, 102, 241, 0.5);
}

.hearing-sdk-floating-button:active {
  transform: translateY(0);
}

.hearing-sdk-floating-button.bottom-right {
  bottom: 24px;
  right: 24px;
}

.hearing-sdk-floating-button.bottom-left {
  bottom: 24px;
  left: 24px;
}

.hearing-sdk-floating-button svg {
  width: 16px;
  height: 16px;
}

.hearing-sdk-floating-button--pulse {
  animation: hearing-sdk-pulse 2s infinite;
}

@keyframes hearing-sdk-pulse {
  0% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(99, 102, 241, 0.6);
  }
  100% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  }
}
`;function h(){if(document.getElementById("hearing-sdk-styles"))return;const e=document.createElement("style");e.id="hearing-sdk-styles",e.textContent=v,document.head.appendChild(e)}const b='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>';function y(e){h();const t=document.createElement("button");return t.className=`hearing-sdk-floating-button ${e.position} hearing-sdk-floating-button--pulse`,t.innerHTML=`${b}<span>${e.text}</span>`,t.setAttribute("aria-label",e.text),t.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),e.onClick()}),t}function k(){const e=document.querySelector(".hearing-sdk-floating-button");e&&e.remove()}function x(){h();const e=document.createElement("div");e.className="hearing-sdk-recording-indicator",e.id="hearing-sdk-recording-indicator";const t=document.createElement("div");t.className="hearing-sdk-recording-indicator__dot";const n=document.createElement("span");return n.textContent="REC",e.appendChild(t),e.appendChild(n),e}function I(){if(document.getElementById("hearing-sdk-recording-indicator"))return;const e=x();document.body.appendChild(e)}function H(){const e=document.getElementById("hearing-sdk-recording-indicator");e&&e.remove()}class u{constructor(t){this.eventQueue=[],this.startTime=0,this.flushIntervalId=null,this.initialized=!1,this.returnUrl="",this.clickHandler=null,this.scrollHandler=null,this.visibilityHandler=null,this.getElapsedMs=()=>Date.now()-this.startTime,this.addEvent=n=>{this.eventQueue.push(n),this.log("Event added:",n.eventType,this.eventQueue.length)},this.config={sessionId:t.sessionId,supabaseUrl:t.supabaseUrl,debug:t.debug??!1,flushInterval:t.flushInterval??5e3,buttonText:t.buttonText??"Return to Interview",buttonPosition:t.buttonPosition??"bottom-right"},this.apiClient=new p(this.config.supabaseUrl,this.config.debug)}log(...t){this.config.debug&&console.log("[HearingSDK]",...t)}async init(){if(this.initialized)return this.log("Already initialized"),!0;this.log("Initializing with sessionId:",this.config.sessionId);const t=await this.apiClient.getContext(this.config.sessionId);return t?(this.returnUrl=t.returnUrl,this.startTime=Date.now(),this.clickHandler=f(this.addEvent,this.getElapsedMs),this.scrollHandler=m(this.addEvent,this.getElapsedMs),this.visibilityHandler=w(this.addEvent,this.getElapsedMs),document.addEventListener("click",this.clickHandler,!0),window.addEventListener("scroll",this.scrollHandler,{passive:!0}),document.addEventListener("visibilitychange",this.visibilityHandler),this.addEvent({eventType:"page_view",pageUrl:window.location.href,pageTitle:document.title,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,elapsedMs:0,timestamp:new Date().toISOString()}),I(),this.showFloatingButton(),this.flushIntervalId=setInterval(()=>{this.flush()},this.config.flushInterval),window.addEventListener("beforeunload",()=>{this.flush()}),this.initialized=!0,this.log("Initialized successfully"),!0):(this.log("Failed to get context"),!1)}showFloatingButton(){const t=y({text:this.config.buttonText,position:this.config.buttonPosition,onClick:()=>this.handleReturn()});document.body.appendChild(t)}async handleReturn(){this.log("Return button clicked");const t=await this.apiClient.markReturned(this.config.sessionId,window.location.href,this.getElapsedMs());await this.flush(),this.destroy();const n=(t==null?void 0:t.returnUrl)||this.returnUrl;n&&(window.location.href=n)}async flush(){if(this.eventQueue.length===0)return;const t=[...this.eventQueue];this.eventQueue=[],this.log("Flushing events:",t.length),await this.apiClient.ingestEvents(this.config.sessionId,t)}destroy(){this.log("Destroying tracker"),this.clickHandler&&document.removeEventListener("click",this.clickHandler,!0),this.scrollHandler&&window.removeEventListener("scroll",this.scrollHandler),this.visibilityHandler&&document.removeEventListener("visibilitychange",this.visibilityHandler),this.flushIntervalId&&clearInterval(this.flushIntervalId),k(),H(),this.initialized=!1}}let r=null;const g={async init(e){return r?(console.warn("[HearingSDK] Already initialized. Call destroy() first."),!1):(r=new u(e),r.init())},destroy(){r&&(r.destroy(),r=null)},async flush(){r&&await r.flush()}};return typeof window<"u"&&(window.HearingSDK=g),c.HearingSDK=g,c.InterviewTracker=u,Object.defineProperty(c,Symbol.toStringTag,{value:"Module"}),c}({});
//# sourceMappingURL=hearing-sdk.iife.js.map
