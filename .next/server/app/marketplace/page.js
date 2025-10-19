(()=>{var e={};e.id=94,e.ids=[94],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8086:e=>{"use strict";e.exports=require("module")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},12412:e=>{"use strict";e.exports=require("assert")},14537:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});let r=(0,s(71104).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/altcoin-daddy/Downloads/ownly/app/marketplace/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/altcoin-daddy/Downloads/ownly/app/marketplace/page.tsx","default")},14621:(e,t,s)=>{"use strict";s.d(t,{BK:()=>i,eu:()=>l,q5:()=>o});var r=s(6662);s(82407);var a=s(32836),n=s(91689);function l({className:e,...t}){return(0,r.jsx)(a.bL,{"data-slot":"avatar",className:(0,n.cn)("relative flex size-8 shrink-0 overflow-hidden rounded-full",e),...t})}function i({className:e,...t}){return(0,r.jsx)(a._V,{"data-slot":"avatar-image",className:(0,n.cn)("aspect-square size-full",e),...t})}function o({className:e,...t}){return(0,r.jsx)(a.H4,{"data-slot":"avatar-fallback",className:(0,n.cn)("bg-muted flex size-full items-center justify-center rounded-full",e),...t})}},15470:(e,t,s)=>{"use strict";s.d(t,{dj:()=>p});var r=s(82407);let a=0,n=new Map,l=e=>{if(n.has(e))return;let t=setTimeout(()=>{n.delete(e),d({type:"REMOVE_TOAST",toastId:e})},1e6);n.set(e,t)},i=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case"DISMISS_TOAST":{let{toastId:s}=t;return s?l(s):e.toasts.forEach(e=>{l(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===s||void 0===s?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===t.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)}}},o=[],c={toasts:[]};function d(e){c=i(c,e),o.forEach(e=>{e(c)})}function u({...e}){let t=(a=(a+1)%Number.MAX_SAFE_INTEGER).toString(),s=()=>d({type:"DISMISS_TOAST",toastId:t});return d({type:"ADD_TOAST",toast:{...e,id:t,open:!0,onOpenChange:e=>{e||s()}}}),{id:t,dismiss:s,update:e=>d({type:"UPDATE_TOAST",toast:{...e,id:t}})}}function p(){let[e,t]=r.useState(c);return r.useEffect(()=>(o.push(t),()=>{let e=o.indexOf(t);e>-1&&o.splice(e,1)}),[e]),{...e,toast:u,dismiss:e=>d({type:"DISMISS_TOAST",toastId:e})}}},19121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},20314:(e,t,s)=>{Promise.resolve().then(s.bind(s,14537))},23914:(e,t,s)=>{"use strict";s.d(t,{Cf:()=>d,L3:()=>p,c7:()=>u,lG:()=>i,rr:()=>m});var r=s(6662);s(82407);var a=s(18962),n=s(77139),l=s(91689);function i({...e}){return(0,r.jsx)(a.bL,{"data-slot":"dialog",...e})}function o({...e}){return(0,r.jsx)(a.ZL,{"data-slot":"dialog-portal",...e})}function c({className:e,...t}){return(0,r.jsx)(a.hJ,{"data-slot":"dialog-overlay",className:(0,l.cn)("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",e),...t})}function d({className:e,children:t,showCloseButton:s=!0,...i}){return(0,r.jsxs)(o,{"data-slot":"dialog-portal",children:[(0,r.jsx)(c,{}),(0,r.jsxs)(a.UC,{"data-slot":"dialog-content",className:(0,l.cn)("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",e),...i,children:[t,s&&(0,r.jsxs)(a.bm,{"data-slot":"dialog-close",className:"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",children:[(0,r.jsx)(n.A,{}),(0,r.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})}function u({className:e,...t}){return(0,r.jsx)("div",{"data-slot":"dialog-header",className:(0,l.cn)("flex flex-col gap-2 text-center sm:text-left",e),...t})}function p({className:e,...t}){return(0,r.jsx)(a.hE,{"data-slot":"dialog-title",className:(0,l.cn)("text-lg leading-none font-semibold",e),...t})}function m({className:e,...t}){return(0,r.jsx)(a.VY,{"data-slot":"dialog-description",className:(0,l.cn)("text-muted-foreground text-sm",e),...t})}},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},34631:e=>{"use strict";e.exports=require("tls")},47649:(e,t,s)=>{"use strict";s.d(t,{w:()=>l});var r=s(6662);s(82407);var a=s(4007),n=s(91689);function l({className:e,orientation:t="horizontal",decorative:s=!0,...l}){return(0,r.jsx)(a.b,{"data-slot":"separator",decorative:s,orientation:t,className:(0,n.cn)("bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",e),...l})}},48161:e=>{"use strict";e.exports=require("node:os")},53053:e=>{"use strict";e.exports=require("node:diagnostics_channel")},53465:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});let r=(0,s(51555).A)("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]])},53963:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>en});var r=s(6662),a=s(82407),n=s(77300),l=s(42458),i=s(73077),o=s(82768),c=s(40478),d=s(3157),u=s(14621),p=s(50912),m=s(48489),f=s(31834);function g({listing:e,onBuy:t,onViewDetails:s,userAddress:n}){let[l,g]=(0,a.useState)(!1),x=e.seller===n,h=n&&!x&&"active"===e.status;return(0,r.jsx)(o.Zp,{className:"group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-foreground/20",children:(0,r.jsxs)(o.Wu,{className:"p-0",children:[(0,r.jsxs)("div",{className:"relative aspect-square overflow-hidden bg-muted",children:[l?(0,r.jsx)("div",{className:"w-full h-full flex items-center justify-center text-muted-foreground",children:(0,r.jsx)("span",{children:"Image not available"})}):(0,r.jsx)(i.default,{src:e.nft_metadata?.image||"/placeholder.svg",alt:e.nft_metadata?.name||"NFT",fill:!0,className:"object-cover group-hover:scale-105 transition-transform duration-300",onError:()=>g(!0)}),(0,r.jsx)(d.E,{className:`absolute top-3 right-3 capitalize ${{active:"bg-green-500/10 text-green-500 border-green-500/20",sold:"bg-gray-500/10 text-gray-500 border-gray-500/20",cancelled:"bg-red-500/10 text-red-500 border-red-500/20"}[e.status]}`,children:e.status}),x&&(0,r.jsx)(d.E,{className:"absolute top-3 left-3 bg-blue-500/10 text-blue-500 border-blue-500/20",children:"Your Listing"})]}),(0,r.jsxs)("div",{className:"p-4 space-y-3",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("h3",{className:"font-bold text-lg mb-1 group-hover:text-muted-foreground transition-colors line-clamp-1",children:e.nft_metadata?.name||`NFT #${e.nft_id}`}),e.nft_metadata?.description&&(0,r.jsx)("p",{className:"text-sm text-muted-foreground line-clamp-2",children:e.nft_metadata.description})]}),e.nft_metadata?.creator&&(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[(0,r.jsx)(u.eu,{className:"w-6 h-6",children:(0,r.jsx)(u.q5,{children:(0,r.jsx)(p.A,{className:"w-3 h-3"})})}),(0,r.jsxs)("span",{className:"text-xs text-muted-foreground",children:[e.nft_metadata.creator.slice(0,6),"...",e.nft_metadata.creator.slice(-4)]})]}),(0,r.jsxs)("div",{className:"space-y-2",children:[(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("p",{className:"text-xs text-muted-foreground",children:"Price"}),(0,r.jsxs)("p",{className:"font-bold text-lg",children:[e.price," ",e.currency]})]}),(0,r.jsxs)("div",{className:"text-right",children:[(0,r.jsx)("p",{className:"text-xs text-muted-foreground",children:"Seller"}),(0,r.jsxs)("p",{className:"text-xs font-mono",children:[e.seller.slice(0,6),"...",e.seller.slice(-4)]})]})]}),(0,r.jsxs)("div",{className:"flex items-center gap-1 text-xs text-muted-foreground",children:[(0,r.jsx)(m.A,{className:"w-3 h-3"}),"Listed ",new Date(e.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})]})]}),(0,r.jsxs)("div",{className:"flex gap-2 pt-2 border-t border-border",children:[(0,r.jsx)(c.$,{variant:"outline",size:"sm",onClick:()=>s(e),className:"flex-1",children:"View Details"}),h&&(0,r.jsxs)(c.$,{size:"sm",onClick:()=>t(e),className:"flex-1",children:[(0,r.jsx)(f.A,{className:"w-4 h-4 mr-1"}),"Buy Now"]}),x&&"active"===e.status&&(0,r.jsx)(c.$,{variant:"secondary",size:"sm",className:"flex-1",disabled:!0,children:"Your Listing"}),!n&&(0,r.jsx)(c.$,{variant:"secondary",size:"sm",className:"flex-1",disabled:!0,children:"Connect Wallet"})]})]})]})})}var x=s(23914),h=s(47649),b=s(15470),v=s(85668),N=s(96517),y=s(60170);function w({listing:e,open:t,onOpenChange:s,onPurchase:n,userAddress:l}){let[o,u]=(0,a.useState)(!1),[p,m]=(0,a.useState)(!1),{toast:g}=(0,b.dj)(),w=async()=>{if(!e||!l){g({title:"Error",description:"Please connect your wallet to purchase NFTs",variant:"destructive"});return}if(e.seller===l){g({title:"Error",description:"You cannot purchase your own NFT",variant:"destructive"});return}u(!0);try{await n(e.listing_id),g({title:"Purchase Successful!",description:`You have successfully purchased ${e.nft_metadata?.name||"this NFT"}`}),s(!1),j()}catch(e){console.error("Purchase failed:",e),g({title:"Purchase Failed",description:e instanceof Error?e.message:"Failed to purchase NFT. Please try again.",variant:"destructive"})}finally{u(!1)}},j=()=>{m(!1)},D=()=>{o||(s(!1),j())};if(!e)return null;let C=e.seller===l,T=l&&!C&&"active"===e.status;return(0,r.jsx)(x.lG,{open:t,onOpenChange:D,children:(0,r.jsxs)(x.Cf,{className:"max-w-md",children:[(0,r.jsx)(x.c7,{children:(0,r.jsxs)(x.L3,{className:"flex items-center gap-2",children:[(0,r.jsx)(f.A,{className:"w-5 h-5"}),"Purchase NFT"]})}),(0,r.jsxs)("div",{className:"space-y-4",children:[(0,r.jsx)("div",{className:"relative aspect-square rounded-lg overflow-hidden bg-muted",children:p?(0,r.jsx)("div",{className:"w-full h-full flex items-center justify-center text-muted-foreground",children:(0,r.jsx)("span",{children:"Image not available"})}):(0,r.jsx)(i.default,{src:e.nft_metadata?.image||"/placeholder.svg",alt:e.nft_metadata?.name||"NFT",fill:!0,className:"object-cover",onError:()=>m(!0)})}),(0,r.jsxs)("div",{className:"space-y-2",children:[(0,r.jsx)("h3",{className:"font-bold text-lg",children:e.nft_metadata?.name||`NFT #${e.nft_id}`}),e.nft_metadata?.description&&(0,r.jsx)("p",{className:"text-sm text-muted-foreground line-clamp-3",children:e.nft_metadata.description}),(0,r.jsx)("div",{className:"flex items-center gap-2",children:(0,r.jsx)(d.E,{variant:"outline",children:e.nft_metadata?.collection_id||"Unknown Collection"})})]}),(0,r.jsx)(h.w,{}),(0,r.jsxs)("div",{className:"space-y-3",children:[(0,r.jsxs)("div",{className:"flex justify-between items-center",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"Price"}),(0,r.jsxs)("span",{className:"font-bold text-lg",children:[e.price," ",e.currency]})]}),(0,r.jsxs)("div",{className:"flex justify-between items-center",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"Seller"}),(0,r.jsxs)("span",{className:"text-sm font-mono",children:[e.seller.slice(0,6),"...",e.seller.slice(-4)]})]}),(0,r.jsxs)("div",{className:"flex justify-between items-center",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"Status"}),(0,r.jsx)(d.E,{variant:"active"===e.status?"default":"secondary",className:"capitalize",children:e.status})]})]}),(0,r.jsx)(h.w,{}),!l&&(0,r.jsxs)("div",{className:"flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg",children:[(0,r.jsx)(v.A,{className:"w-4 h-4 text-yellow-500"}),(0,r.jsx)("span",{className:"text-sm text-yellow-700 dark:text-yellow-300",children:"Connect your wallet to purchase this NFT"})]}),C&&(0,r.jsxs)("div",{className:"flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg",children:[(0,r.jsx)(v.A,{className:"w-4 h-4 text-blue-500"}),(0,r.jsx)("span",{className:"text-sm text-blue-700 dark:text-blue-300",children:"This is your own listing"})]}),(0,r.jsxs)("div",{className:"flex gap-2",children:[(0,r.jsx)(c.$,{variant:"outline",onClick:D,disabled:o,className:"flex-1",children:"Cancel"}),(0,r.jsx)(c.$,{onClick:w,disabled:!T||o,className:"flex-1",children:o?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(N.A,{className:"w-4 h-4 mr-2 animate-spin"}),"Processing..."]}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(y.A,{className:"w-4 h-4 mr-2"}),"Buy Now"]})})]})]})]})})}var j=s(37177),D=s(64850),C="Progress",[T,F]=(0,j.A)(C),[I,k]=T(C),S=a.forwardRef((e,t)=>{var s,a;let{__scopeProgress:n,value:l=null,max:i,getValueLabel:o=L,...c}=e;(i||0===i)&&!_(i)&&console.error((s=`${i}`,`Invalid prop \`max\` of value \`${s}\` supplied to \`Progress\`. Only numbers greater than 0 are valid max values. Defaulting to \`100\`.`));let d=_(i)?i:100;null===l||P(l,d)||console.error((a=`${l}`,`Invalid prop \`value\` of value \`${a}\` supplied to \`Progress\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or 100 if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`));let u=P(l,d)?l:null,p=E(u)?o(u,d):void 0;return(0,r.jsx)(I,{scope:n,value:u,max:d,children:(0,r.jsx)(D.sG.div,{"aria-valuemax":d,"aria-valuemin":0,"aria-valuenow":E(u)?u:void 0,"aria-valuetext":p,role:"progressbar","data-state":R(u,d),"data-value":u??void 0,"data-max":d,...c,ref:t})})});S.displayName=C;var A="ProgressIndicator",M=a.forwardRef((e,t)=>{let{__scopeProgress:s,...a}=e,n=k(A,s);return(0,r.jsx)(D.sG.div,{"data-state":R(n.value,n.max),"data-value":n.value??void 0,"data-max":n.max,...a,ref:t})});function L(e,t){return`${Math.round(e/t*100)}%`}function R(e,t){return null==e?"indeterminate":e===t?"complete":"loading"}function E(e){return"number"==typeof e}function _(e){return E(e)&&!isNaN(e)&&e>0}function P(e,t){return E(e)&&!isNaN(e)&&e<=t&&e>=0}M.displayName=A;var $=s(91689);let U=a.forwardRef(({className:e,value:t,...s},a)=>(0,r.jsx)(S,{ref:a,className:(0,$.cn)("relative h-2 w-full overflow-hidden rounded-full bg-primary/20",e),...s,children:(0,r.jsx)(M,{className:"h-full w-full flex-1 bg-primary transition-all",style:{transform:`translateX(-${100-(t||0)}%)`}})}));U.displayName=S.displayName;var O=s(53465),q=s(36622),V=s(3369);function z({open:e,onOpenChange:t,transaction:s,onRetry:n}){let[l,i]=(0,a.useState)(0);if(!s)return null;let o="completed"===s.status||"failed"===s.status,u="failed"===s.status&&n;return(0,r.jsx)(x.lG,{open:e,onOpenChange:o?t:void 0,children:(0,r.jsxs)(x.Cf,{className:"max-w-md",hideCloseButton:!o,children:[(0,r.jsx)(x.c7,{children:(0,r.jsxs)(x.L3,{className:"flex items-center gap-2",children:[(()=>{switch(s.status){case"pending":return(0,r.jsx)(m.A,{className:"w-6 h-6 text-yellow-500"});case"processing":return(0,r.jsx)(N.A,{className:"w-6 h-6 text-blue-500 animate-spin"});case"completed":return(0,r.jsx)(O.A,{className:"w-6 h-6 text-green-500"});case"failed":return(0,r.jsx)(q.A,{className:"w-6 h-6 text-red-500"})}})(),(()=>{switch(s.type){case"buy":return"Purchase NFT";case"sell":return"Sell NFT";case"list":return"List NFT for Sale";case"transfer":return"Transfer NFT"}})()]})}),(0,r.jsxs)("div",{className:"space-y-4",children:[(0,r.jsx)("div",{className:"flex justify-center",children:(0,r.jsx)(d.E,{className:`capitalize ${(()=>{switch(s.status){case"pending":return"bg-yellow-500/10 text-yellow-500 border-yellow-500/20";case"processing":return"bg-blue-500/10 text-blue-500 border-blue-500/20";case"completed":return"bg-green-500/10 text-green-500 border-green-500/20";case"failed":return"bg-red-500/10 text-red-500 border-red-500/20"}})()}`,children:s.status})}),"processing"===s.status&&(0,r.jsxs)("div",{className:"space-y-2",children:[(0,r.jsx)(U,{value:l,className:"h-2"}),(0,r.jsxs)("p",{className:"text-xs text-center text-muted-foreground",children:[Math.round(l),"% complete"]})]}),(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)("p",{className:"font-medium",children:(()=>{switch(s.status){case"pending":return"Transaction initiated";case"processing":return"Processing on blockchain...";case"completed":return"Transaction completed successfully!";case"failed":return"Transaction failed"}})()}),"processing"===s.status&&(0,r.jsx)("p",{className:"text-sm text-muted-foreground mt-1",children:"This may take a few moments..."})]}),(0,r.jsx)(h.w,{}),(0,r.jsxs)("div",{className:"space-y-2",children:[s.nftName&&(0,r.jsxs)("div",{className:"flex justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"NFT"}),(0,r.jsx)("span",{className:"text-sm font-medium",children:s.nftName})]}),s.nftId&&(0,r.jsxs)("div",{className:"flex justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"NFT ID"}),(0,r.jsxs)("span",{className:"text-sm font-mono",children:["#",s.nftId]})]}),s.price&&(0,r.jsxs)("div",{className:"flex justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"Price"}),(0,r.jsxs)("span",{className:"text-sm font-medium",children:[s.price," ",s.currency]})]}),s.fromAddress&&(0,r.jsxs)("div",{className:"flex justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"From"}),(0,r.jsxs)("span",{className:"text-sm font-mono",children:[s.fromAddress.slice(0,6),"...",s.fromAddress.slice(-4)]})]}),s.toAddress&&(0,r.jsxs)("div",{className:"flex justify-between",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"To"}),(0,r.jsxs)("span",{className:"text-sm font-mono",children:[s.toAddress.slice(0,6),"...",s.toAddress.slice(-4)]})]}),s.transactionHash&&(0,r.jsxs)("div",{className:"flex justify-between items-center",children:[(0,r.jsx)("span",{className:"text-sm text-muted-foreground",children:"Transaction"}),(0,r.jsxs)(c.$,{variant:"ghost",size:"sm",className:"h-auto p-0 text-sm",onClick:()=>{let e=`https://flowscan.org/transaction/${s.transactionHash}`;window.open(e,"_blank")},children:[(0,r.jsxs)("span",{className:"font-mono",children:[s.transactionHash.slice(0,6),"...",s.transactionHash.slice(-4)]}),(0,r.jsx)(V.A,{className:"w-3 h-3 ml-1"})]})]})]}),"failed"===s.status&&s.error&&(0,r.jsxs)("div",{className:"flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg",children:[(0,r.jsx)(v.A,{className:"w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"}),(0,r.jsxs)("div",{className:"text-sm text-red-700 dark:text-red-300",children:[(0,r.jsx)("p",{className:"font-medium",children:"Transaction Failed"}),(0,r.jsx)("p",{className:"mt-1",children:s.error})]})]}),o&&(0,r.jsxs)("div",{className:"flex gap-2",children:[u&&(0,r.jsx)(c.$,{variant:"outline",onClick:n,className:"flex-1",children:"Try Again"}),(0,r.jsx)(c.$,{onClick:()=>t(!1),className:"flex-1",variant:"completed"===s.status?"default":"outline",children:"completed"===s.status?"Done":"Close"})]}),("pending"===s.status||"processing"===s.status)&&(0,r.jsx)("div",{className:"text-center text-sm text-muted-foreground",children:"Please wait while the transaction is processed..."})]})]})})}var Z=s(92740),G=s(72014),W=s(86367),H=s(4515),B=s(2651),Y=s(73148),X=s(74133),K=s(43055);let J=`
import DapperMarket from 0x${(0,K.RZ)("DapperMarket").replace("0x","")}
import DapperCollectibles from 0x${(0,K.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,K.RZ)("MetadataViews").replace("0x","")}

pub fun main(): [ListingData] {
  let listings: [ListingData] = []
  
  // Get all active listings from DapperMarket
  let listingIDs = DapperMarket.getListingIDs()
  
  for listingID in listingIDs {
    if let listing = DapperMarket.borrowListing(listingID: listingID) {
      // Get NFT metadata
      let nftRef = listing.borrowNFT()
      var name = ""
      var description = ""
      var thumbnail = ""
      
      if let display = nftRef.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
        name = display.name
        description = display.description
        thumbnail = display.thumbnail.uri()
      }
      
      listings.append(ListingData(
        listingID: listingID,
        nftID: listing.getNFTID(),
        seller: listing.getSeller(),
        price: listing.getPrice(),
        currency: "FLOW",
        status: "active",
        createdAt: listing.getCreatedAt(),
        nftMetadata: NFTMetadata(
          name: name,
          description: description,
          image: thumbnail,
          collectionId: "ownly_collectibles"
        )
      ))
    }
  }
  
  return listings
}

pub struct ListingData {
  pub let listingID: UInt64
  pub let nftID: UInt64
  pub let seller: Address
  pub let price: UFix64
  pub let currency: String
  pub let status: String
  pub let createdAt: UFix64
  pub let nftMetadata: NFTMetadata
  
  init(
    listingID: UInt64,
    nftID: UInt64,
    seller: Address,
    price: UFix64,
    currency: String,
    status: String,
    createdAt: UFix64,
    nftMetadata: NFTMetadata
  ) {
    self.listingID = listingID
    self.nftID = nftID
    self.seller = seller
    self.price = price
    self.currency = currency
    self.status = status
    self.createdAt = createdAt
    self.nftMetadata = nftMetadata
  }
}

pub struct NFTMetadata {
  pub let name: String
  pub let description: String
  pub let image: String
  pub let collectionId: String
  
  init(name: String, description: String, image: String, collectionId: String) {
    self.name = name
    self.description = description
    self.image = image
    self.collectionId = collectionId
  }
}
`,Q=`
import DapperMarket from 0x${(0,K.RZ)("DapperMarket").replace("0x","")}
import DapperCollectibles from 0x${(0,K.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,K.RZ)("MetadataViews").replace("0x","")}

pub fun main(listingID: UInt64): ListingDetails? {
  if let listing = DapperMarket.borrowListing(listingID: listingID) {
    // Get NFT metadata
    let nftRef = listing.borrowNFT()
    var name = ""
    var description = ""
    var thumbnail = ""
    
    if let display = nftRef.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
      name = display.name
      description = display.description
      thumbnail = display.thumbnail.uri()
    }
    
    return ListingDetails(
      listingID: listingID,
      nftID: listing.getNFTID(),
      seller: listing.getSeller(),
      price: listing.getPrice(),
      currency: "FLOW",
      status: "active",
      createdAt: listing.getCreatedAt(),
      nftName: name,
      nftDescription: description,
      nftImage: thumbnail
    )
  }
  
  return nil
}

pub struct ListingDetails {
  pub let listingID: UInt64
  pub let nftID: UInt64
  pub let seller: Address
  pub let price: UFix64
  pub let currency: String
  pub let status: String
  pub let createdAt: UFix64
  pub let nftName: String
  pub let nftDescription: String
  pub let nftImage: String
  
  init(
    listingID: UInt64,
    nftID: UInt64,
    seller: Address,
    price: UFix64,
    currency: String,
    status: String,
    createdAt: UFix64,
    nftName: String,
    nftDescription: String,
    nftImage: String
  ) {
    self.listingID = listingID
    self.nftID = nftID
    self.seller = seller
    self.price = price
    self.currency = currency
    self.status = status
    self.createdAt = createdAt
    self.nftName = nftName
    self.nftDescription = nftDescription
    self.nftImage = nftImage
  }
}
`;class ee{async listNFTForSale(e,t,s){try{return console.log(`[Flow] Listing NFT ${e} for ${t} FLOW`),{transactionId:await (0,Y.Mp)(`
        import NonFungibleToken from 0x${(0,K.RZ)("NonFungibleToken").replace("0x","")}
        import DapperCollectibles from 0x${(0,K.RZ)("DapperCollectibles").replace("0x","")}
        import DapperMarket from 0x${(0,K.RZ)("DapperMarket").replace("0x","")}
        import FungibleToken from 0x${(0,K.RZ)("FungibleToken").replace("0x","")}
        import FlowToken from 0x${(0,K.RZ)("FlowToken").replace("0x","")}

        transaction(nftID: UInt64, price: UFix64) {
          let sellerCollection: &DapperCollectibles.Collection
          let paymentReceiver: Capability<&{FungibleToken.Receiver}>
          
          prepare(signer: AuthAccount) {
            // Get seller's collection reference
            self.sellerCollection = signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection)
              ?? panic("Could not borrow seller collection")
            
            // Get payment receiver capability
            self.paymentReceiver = signer.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            // Verify NFT exists in collection
            let nftRef = self.sellerCollection.borrowCollectible(id: nftID)
              ?? panic("NFT does not exist in collection")
          }
          
          execute {
            // Create listing on DapperMarket
            DapperMarket.createListing(
              nftID: nftID,
              price: price,
              seller: signer.address,
              paymentReceiver: self.paymentReceiver
            )
          }
        }
        `,[B.arg(e,B.t.UInt64),B.arg(t,B.t.UFix64)],{onStatusUpdate:s}),status:"completed"}}catch(e){return console.error("[Flow] List NFT error:",e),{transactionId:"",status:"failed",error:e instanceof Error?e.message:"Failed to list NFT"}}}async purchaseNFT(e,t,s){try{if(console.log(`[Flow] Purchasing NFT ${e} from ${t}`),!(await B.currentUser().snapshot()).addr)throw Error("Wallet not connected");return{transactionId:await (0,Y.Mp)(`
        import NonFungibleToken from 0x${(0,K.RZ)("NonFungibleToken").replace("0x","")}
        import DapperCollectibles from 0x${(0,K.RZ)("DapperCollectibles").replace("0x","")}
        import DapperMarket from 0x${(0,K.RZ)("DapperMarket").replace("0x","")}
        import FungibleToken from 0x${(0,K.RZ)("FungibleToken").replace("0x","")}
        import FlowToken from 0x${(0,K.RZ)("FlowToken").replace("0x","")}

        transaction(nftID: UInt64, seller: Address) {
          let paymentVault: @FlowToken.Vault
          let buyerCollection: &{DapperCollectibles.CollectionPublic}
          let listing: &DapperMarket.Listing
          
          prepare(signer: AuthAccount) {
            // Ensure buyer has collection set up
            if signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection) == nil {
              // Create new collection
              let collection <- DapperCollectibles.createEmptyCollection()
              signer.save(<-collection, to: /storage/DapperCollectiblesCollection)
              signer.link<&{DapperCollectibles.CollectionPublic}>(
                /public/DapperCollectiblesCollection,
                target: /storage/DapperCollectiblesCollection
              )
            }
            
            // Get buyer's collection reference
            self.buyerCollection = signer.getCapability(/public/DapperCollectiblesCollection)
              .borrow<&{DapperCollectibles.CollectionPublic}>()
              ?? panic("Could not borrow buyer collection")
            
            // Get listing reference
            self.listing = DapperMarket.borrowListing(nftID: nftID, seller: seller)
              ?? panic("Could not find listing for this NFT")
            
            // Get listing price
            let price = self.listing.getPrice()
            
            // Withdraw payment from buyer's Flow token vault
            let mainVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow Flow token vault")
            
            // Check sufficient balance
            if mainVault.balance < price {
              panic("Insufficient FLOW balance for purchase")
            }
            
            self.paymentVault <- mainVault.withdraw(amount: price) as! @FlowToken.Vault
          }
          
          execute {
            // Purchase NFT from DapperMarket
            let nft <- DapperMarket.purchase(
              nftID: nftID,
              seller: seller,
              payment: <-self.paymentVault
            )
            
            // Deposit NFT to buyer's collection
            self.buyerCollection.deposit(token: <-nft)
            
            log("NFT purchase completed successfully")
          }
        }
        `,[B.arg(e,B.t.UInt64),B.arg(t,B.t.Address)],{onStatusUpdate:s}),status:"completed"}}catch(t){console.error("[Flow] Purchase NFT error:",t);let e="Failed to purchase NFT";return t instanceof Error&&(e=t.message.includes("Insufficient FLOW balance")?"Insufficient FLOW balance for this purchase":t.message.includes("Could not find listing")?"This NFT is no longer available for purchase":t.message.includes("User rejected")?"Transaction was cancelled by user":t.message),{transactionId:"",status:"failed",error:e}}}async removeListing(e,t){try{return console.log(`[Flow] Removing listing for NFT ${e}`),{transactionId:await (0,Y.Mp)(`
        import DapperMarket from 0x${(0,K.RZ)("DapperMarket").replace("0x","")}

        transaction(nftID: UInt64) {
          prepare(signer: AuthAccount) {
            // Verify signer is the seller
            let listing = DapperMarket.borrowListing(nftID: nftID, seller: signer.address)
              ?? panic("No listing found or not authorized")
          }
          
          execute {
            // Remove listing from DapperMarket
            DapperMarket.removeListing(nftID: nftID, seller: signer.address)
          }
        }
        `,[B.arg(e,B.t.UInt64)],{onStatusUpdate:t}),status:"completed"}}catch(e){return console.error("[Flow] Remove listing error:",e),{transactionId:"",status:"failed",error:e instanceof Error?e.message:"Failed to remove listing"}}}async getMarketplaceListings(){try{return console.log("[Flow] Fetching marketplace listings"),await (0,X.HG)(J)||[]}catch(e){return console.error("[Flow] Get listings error:",e),[]}}async getListingDetails(e){try{return console.log(`[Flow] Fetching listing details for ${e}`),await (0,X.HG)(Q,[B.arg(e,B.t.UInt64)])}catch(e){return console.error("[Flow] Get listing details error:",e),null}}async checkFlowBalance(e,t){try{let s=await (0,X.HG)(`
        import FlowToken from 0x${(0,K.RZ)("FlowToken").replace("0x","")}
        import FungibleToken from 0x${(0,K.RZ)("FungibleToken").replace("0x","")}

        pub fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account.getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")
          
          return vaultRef.balance
        }
      `,[B.arg(e,B.t.Address)]),r=parseFloat(t);return parseFloat(s.toString())>=r}catch(e){return console.error("[Flow] Check balance error:",e),!1}}async setupUserCollection(e){try{return console.log("[Flow] Setting up user collection"),{transactionId:await (0,Y.Mp)(`
        import NonFungibleToken from 0x${(0,K.RZ)("NonFungibleToken").replace("0x","")}
        import DapperCollectibles from 0x${(0,K.RZ)("DapperCollectibles").replace("0x","")}

        transaction() {
          prepare(signer: AuthAccount) {
            // Check if collection already exists
            if signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection) == nil {
              // Create new collection
              let collection <- DapperCollectibles.createEmptyCollection()
              
              // Save collection to storage
              signer.save(<-collection, to: /storage/DapperCollectiblesCollection)
              
              // Create public capability
              signer.link<&{DapperCollectibles.CollectionPublic}>(
                /public/DapperCollectiblesCollection,
                target: /storage/DapperCollectiblesCollection
              )
            }
          }
        }
        `,[],{onStatusUpdate:e}),status:"completed"}}catch(e){return console.error("[Flow] Setup collection error:",e),{transactionId:"",status:"failed",error:e instanceof Error?e.message:"Failed to setup collection"}}}}let et=new ee;var es=s(15911),er=s(79911),ea=s(3901);function en(){let{user:e}=(0,H.v)(),{toast:t}=(0,b.dj)(),s=function(){let{user:e}=(0,H.v)(),{toast:t}=(0,b.dj)(),[s,r]=(0,a.useState)({isLoading:!1,error:null,transactionId:null,status:"idle"}),n=function(e={}){let{toast:t}=(0,b.dj)(),[s,r]=(0,a.useState)({status:"idle",transactionId:null,error:null}),n=(0,a.useCallback)(async(s,a=[],n=9999)=>{try{r({status:"pending",transactionId:null,error:null}),t({title:"Wallet Signature Required",description:"Please approve the transaction in your wallet"});let l=await B.mutate({cadence:s,args:a,limit:n,authorizations:[B.currentUser().authorization]});r(e=>({...e,status:"processing",transactionId:l})),t({title:"Transaction Submitted",description:`Transaction ID: ${l.slice(0,8)}...`});let i=B.tx(l).subscribe(s=>{if(console.log("Transaction status update:",s),r(e=>({...e,blockHeight:s.blockHeight,events:s.events})),e.onStatusUpdate&&e.onStatusUpdate(s),4===s.status)r(e=>({...e,status:"completed"})),t({title:"Transaction Completed",description:"Your transaction has been successfully processed"}),e.onSuccess&&e.onSuccess(l),i();else if(-1===s.status){let a=s.errorMessage||"Transaction failed";r(e=>({...e,status:"failed",error:a})),t({title:"Transaction Failed",description:a,variant:"destructive"}),e.onError&&e.onError(a),i()}});return l}catch(a){let s=a instanceof Error?a.message:"Transaction failed";throw r({status:"failed",transactionId:null,error:s}),t({title:"Transaction Error",description:s,variant:"destructive"}),e.onError&&e.onError(s),a}},[t,e]),l=(0,a.useCallback)(()=>{r({status:"idle",transactionId:null,error:null})},[]);return{...s,executeTransaction:n,reset:l,isLoading:"pending"===s.status||"processing"===s.status}}({onSuccess:e=>{r(t=>({...t,status:"completed",transactionId:e,isLoading:!1}))},onError:e=>{r(t=>({...t,status:"failed",error:e,isLoading:!1}))},onStatusUpdate:e=>{1===e.status?r(e=>({...e,status:"pending"})):(2===e.status||3===e.status)&&r(e=>({...e,status:"processing"}))}}),l=(0,a.useCallback)(async(s,a,l)=>{if(!e?.addr)throw Error("Wallet not connected");r({isLoading:!0,error:null,transactionId:null,status:"pending"});try{if(!await et.checkFlowBalance(e.addr,l.toString()))throw Error("Insufficient FLOW balance for this purchase");let i=await et.purchaseNFT(s,a,e=>{"processing"===n.status&&r(e=>({...e,status:"processing"}))});if("failed"===i.status)throw Error(i.error||"Purchase failed");return r(e=>({...e,status:"completed",transactionId:i.transactionId,isLoading:!1})),t({title:"Purchase Successful!",description:"NFT has been transferred to your wallet"}),i.transactionId}catch(s){let e=s instanceof Error?s.message:"Purchase failed";throw r({isLoading:!1,error:e,transactionId:null,status:"failed"}),t({title:"Purchase Failed",description:e,variant:"destructive"}),s}},[e?.addr,t,n.status]),i=(0,a.useCallback)(async(s,a)=>{if(!e?.addr)throw Error("Wallet not connected");r({isLoading:!0,error:null,transactionId:null,status:"pending"});try{let e=await et.listNFTForSale(s,a,e=>{"processing"===n.status&&r(e=>({...e,status:"processing"}))});if("failed"===e.status)throw Error(e.error||"Listing failed");return r(t=>({...t,status:"completed",transactionId:e.transactionId,isLoading:!1})),t({title:"Listing Created!",description:"Your NFT is now available for purchase"}),e.transactionId}catch(s){let e=s instanceof Error?s.message:"Listing failed";throw r({isLoading:!1,error:e,transactionId:null,status:"failed"}),t({title:"Listing Failed",description:e,variant:"destructive"}),s}},[e?.addr,t,n.status]),o=(0,a.useCallback)(async s=>{if(!e?.addr)throw Error("Wallet not connected");r({isLoading:!0,error:null,transactionId:null,status:"pending"});try{let e=await et.removeListing(s,e=>{"processing"===n.status&&r(e=>({...e,status:"processing"}))});if("failed"===e.status)throw Error(e.error||"Remove listing failed");return r(t=>({...t,status:"completed",transactionId:e.transactionId,isLoading:!1})),t({title:"Listing Removed!",description:"Your NFT is no longer for sale"}),e.transactionId}catch(s){let e=s instanceof Error?s.message:"Remove listing failed";throw r({isLoading:!1,error:e,transactionId:null,status:"failed"}),t({title:"Remove Listing Failed",description:e,variant:"destructive"}),s}},[e?.addr,t,n.status]),c=(0,a.useCallback)(()=>{r({isLoading:!1,error:null,transactionId:null,status:"idle"}),n.reset()},[n]);return{...s,purchaseNFT:l,listNFT:i,removeListing:o,reset:c}}(),[i,o]=(0,a.useState)(""),[d,u]=(0,a.useState)("all"),[p,m]=(0,a.useState)("active"),[f,x]=(0,a.useState)("recent"),[h,v]=(0,a.useState)(""),[N,y]=(0,a.useState)(""),[j,D]=(0,a.useState)([]),[C,T]=(0,a.useState)(!0),[F,I]=(0,a.useState)(null),[k,S]=(0,a.useState)(null),[A,M]=(0,a.useState)(!1),[L,R]=(0,a.useState)(!1),[E,_]=(0,a.useState)(null),P=async()=>{try{T(!0),I(null);let e=new URLSearchParams;"all"!==d&&e.append("category",d),"all"!==p&&e.append("status",p),h&&e.append("minPrice",h),N&&e.append("maxPrice",N),e.append("sortBy","recent"===f?"created_at":f.replace("-","_")),e.append("sortOrder",f.includes("high")?"desc":"asc");let t=await fetch(`/api/marketplace?${e.toString()}`);if(!t.ok)throw Error("Failed to fetch marketplace listings");let s=await t.json();D(s.listings||[])}catch(e){console.error("Error fetching listings:",e),I(e instanceof Error?e.message:"Failed to load marketplace"),D([])}finally{T(!1)}},$=j.filter(e=>{if(!i)return!0;let t=i.toLowerCase(),s=e.nft_metadata?.name?.toLowerCase()||"",r=e.nft_metadata?.description?.toLowerCase()||"",a=e.nft_id.toLowerCase();return s.includes(t)||r.includes(t)||a.includes(t)}),U=e=>{S(e),M(!0)},O=e=>{window.open(`/nft/${e.nft_id}`,"_blank")},q=async t=>{if(!e?.addr||!k)throw Error("Wallet not connected");_({type:"buy",nftName:k.nft_metadata?.name,nftId:k.nft_id,price:k.price,currency:k.currency,fromAddress:k.seller,toAddress:e.addr,status:"pending"}),M(!1),R(!0);try{_(e=>e?{...e,status:"processing"}:null);let e=await s.purchaseNFT(k.nft_id,k.seller,k.price);_(t=>t?{...t,status:"completed",transactionHash:e}:null),P()}catch(e){console.error("Purchase failed:",e),_(t=>t?{...t,status:"failed",error:e instanceof Error?e.message:"Purchase failed"}:null)}},V=()=>{P()},Y=()=>{o(""),u("all"),m("active"),v(""),y(""),x("recent")};return(0,r.jsxs)("div",{className:"min-h-screen bg-background",children:[(0,r.jsx)(n.Y,{}),(0,r.jsx)("main",{className:"pt-24 pb-16",children:(0,r.jsxs)("div",{className:"container mx-auto px-4 sm:px-6 lg:px-8",children:[(0,r.jsx)("div",{className:"mb-12",children:(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("h1",{className:"text-4xl sm:text-5xl font-bold mb-4 text-balance",children:"NFT Marketplace"}),(0,r.jsx)("p",{className:"text-lg text-muted-foreground max-w-2xl text-balance",children:"Discover, buy, and sell unique digital collectibles on Flow blockchain"})]}),(0,r.jsxs)(c.$,{variant:"outline",size:"sm",onClick:V,disabled:C,children:[(0,r.jsx)(es.A,{className:`w-4 h-4 mr-2 ${C?"animate-spin":""}`}),"Refresh"]})]})}),(0,r.jsxs)("div",{className:"mb-8 space-y-4",children:[(0,r.jsxs)("div",{className:"flex flex-col sm:flex-row gap-4",children:[(0,r.jsxs)("div",{className:"relative flex-1",children:[(0,r.jsx)(er.A,{className:"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),(0,r.jsx)(Z.p,{placeholder:"Search NFTs, creators, or NFT IDs...",value:i,onChange:e=>o(e.target.value),className:"pl-10"})]}),(0,r.jsxs)(G.l6,{value:f,onValueChange:x,children:[(0,r.jsx)(G.bq,{className:"w-full sm:w-48",children:(0,r.jsx)(G.yv,{placeholder:"Sort by"})}),(0,r.jsxs)(G.gC,{children:[(0,r.jsx)(G.eb,{value:"recent",children:"Recently Listed"}),(0,r.jsx)(G.eb,{value:"price-low",children:"Price: Low to High"}),(0,r.jsx)(G.eb,{value:"price-high",children:"Price: High to Low"})]})]})]}),(0,r.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[(0,r.jsxs)(G.l6,{value:d,onValueChange:u,children:[(0,r.jsx)(G.bq,{children:(0,r.jsx)(G.yv,{placeholder:"Category"})}),(0,r.jsx)(G.gC,{children:["all","ownly_collectibles","Art","Photography","Digital Art","3D","Music"].map(e=>(0,r.jsx)(G.eb,{value:e,className:"capitalize",children:"all"===e?"All Categories":e},e))})]}),(0,r.jsxs)(G.l6,{value:p,onValueChange:m,children:[(0,r.jsx)(G.bq,{children:(0,r.jsx)(G.yv,{placeholder:"Status"})}),(0,r.jsx)(G.gC,{children:["all","active","sold","cancelled"].map(e=>(0,r.jsx)(G.eb,{value:e,className:"capitalize",children:"all"===e?"All Status":e},e))})]}),(0,r.jsx)(Z.p,{placeholder:"Min Price (FLOW)",value:h,onChange:e=>v(e.target.value),type:"number",min:"0",step:"0.01"}),(0,r.jsx)(Z.p,{placeholder:"Max Price (FLOW)",value:N,onChange:e=>y(e.target.value),type:"number",min:"0",step:"0.01"})]}),(i||"all"!==d||"active"!==p||h||N)&&(0,r.jsx)("div",{className:"flex justify-center",children:(0,r.jsxs)(c.$,{variant:"outline",size:"sm",onClick:Y,children:[(0,r.jsx)(ea.A,{className:"w-4 h-4 mr-2"}),"Clear Filters"]})})]}),(0,r.jsxs)("div",{className:"mb-6 flex items-center justify-between",children:[(0,r.jsx)("p",{className:"text-sm text-muted-foreground",children:C?"Loading listings...":`Showing ${$.length} ${1===$.length?"listing":"listings"}`}),!e?.addr&&(0,r.jsx)("p",{className:"text-sm text-muted-foreground",children:"Connect your wallet to purchase NFTs"})]}),F&&(0,r.jsxs)("div",{className:"text-center py-16",children:[(0,r.jsx)("p",{className:"text-red-500 mb-4",children:F}),(0,r.jsx)(c.$,{onClick:V,children:"Try Again"})]}),C&&(0,r.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",children:Array.from({length:8}).map((e,t)=>(0,r.jsxs)("div",{className:"space-y-3",children:[(0,r.jsx)(W.E,{className:"aspect-square rounded-lg"}),(0,r.jsx)(W.E,{className:"h-4 w-3/4"}),(0,r.jsx)(W.E,{className:"h-4 w-1/2"})]},t))}),!C&&!F&&$.length>0&&(0,r.jsx)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",children:$.map(t=>(0,r.jsx)(g,{listing:t,onBuy:U,onViewDetails:O,userAddress:e?.addr},t.listing_id))}),!C&&!F&&0===$.length&&(0,r.jsxs)("div",{className:"text-center py-16",children:[(0,r.jsx)("p",{className:"text-muted-foreground mb-4",children:0===j.length?"No NFTs are currently listed for sale":"No listings found matching your criteria"}),(0,r.jsx)(c.$,{variant:"outline",onClick:Y,children:"Clear Filters"})]})]})}),(0,r.jsx)(l.w,{}),(0,r.jsx)(w,{listing:k,open:A,onOpenChange:M,onPurchase:q,userAddress:e?.addr}),(0,r.jsx)(z,{open:L,onOpenChange:R,transaction:E,onRetry:()=>{k&&q(k.listing_id)}})]})}},54594:(e,t,s)=>{Promise.resolve().then(s.bind(s,53963))},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},60170:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});let r=(0,s(51555).A)("Wallet",[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]])},60711:(e,t,s)=>{"use strict";s.d(t,{C:()=>l});var r=s(82407),a=s(17581),n=s(28502),l=e=>{let{present:t,children:s}=e,l=function(e){var t,s;let[a,l]=r.useState(),o=r.useRef({}),c=r.useRef(e),d=r.useRef("none"),[u,p]=(t=e?"mounted":"unmounted",s={mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}},r.useReducer((e,t)=>s[e][t]??e,t));return r.useEffect(()=>{let e=i(o.current);d.current="mounted"===u?e:"none"},[u]),(0,n.N)(()=>{let t=o.current,s=c.current;if(s!==e){let r=d.current,a=i(t);e?p("MOUNT"):"none"===a||t?.display==="none"?p("UNMOUNT"):s&&r!==a?p("ANIMATION_OUT"):p("UNMOUNT"),c.current=e}},[e,p]),(0,n.N)(()=>{if(a){let e;let t=a.ownerDocument.defaultView??window,s=s=>{let r=i(o.current).includes(s.animationName);if(s.target===a&&r&&(p("ANIMATION_END"),!c.current)){let s=a.style.animationFillMode;a.style.animationFillMode="forwards",e=t.setTimeout(()=>{"forwards"===a.style.animationFillMode&&(a.style.animationFillMode=s)})}},r=e=>{e.target===a&&(d.current=i(o.current))};return a.addEventListener("animationstart",r),a.addEventListener("animationcancel",s),a.addEventListener("animationend",s),()=>{t.clearTimeout(e),a.removeEventListener("animationstart",r),a.removeEventListener("animationcancel",s),a.removeEventListener("animationend",s)}}p("ANIMATION_END")},[a,p]),{isPresent:["mounted","unmountSuspended"].includes(u),ref:r.useCallback(e=>{e&&(o.current=getComputedStyle(e)),l(e)},[])}}(t),o="function"==typeof s?s({present:l.isPresent}):r.Children.only(s),c=(0,a.s)(l.ref,function(e){let t=Object.getOwnPropertyDescriptor(e.props,"ref")?.get,s=t&&"isReactWarning"in t&&t.isReactWarning;return s?e.ref:(s=(t=Object.getOwnPropertyDescriptor(e,"ref")?.get)&&"isReactWarning"in t&&t.isReactWarning)?e.props.ref:e.props.ref||e.ref}(o));return"function"==typeof s||l.isPresent?r.cloneElement(o,{ref:c}):null};function i(e){return e?.animationName||"none"}l.displayName="Presence"},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},64503:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>u,pages:()=>d,routeModule:()=>p,tree:()=>c});var r=s(41132),a=s(89587),n=s(84299),l=s.n(n),i=s(46468),o={};for(let e in i)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);s.d(t,o);let c={children:["",{children:["marketplace",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,14537)),"/home/altcoin-daddy/Downloads/ownly/app/marketplace/page.tsx"]}]},{loading:[()=>Promise.resolve().then(s.bind(s,86458)),"/home/altcoin-daddy/Downloads/ownly/app/marketplace/loading.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,57098)),"/home/altcoin-daddy/Downloads/ownly/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,27225,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,61460,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,77237,23)),"next/dist/client/components/unauthorized-error"]}]}.children,d=["/home/altcoin-daddy/Downloads/ownly/app/marketplace/page.tsx"],u={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/marketplace/page",pathname:"/marketplace",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},73148:(e,t,s)=>{"use strict";s.d(t,{Mp:()=>l,dQ:()=>n});var r=s(2651),a=s(43055);let n=`
import NonFungibleToken from 0x${(0,a.RZ)("NonFungibleToken").replace("0x","")}
import DapperCollectibles from 0x${(0,a.RZ)("DapperCollectibles").replace("0x","")}
import DapperMarket from 0x${(0,a.RZ)("DapperMarket").replace("0x","")}
import FungibleToken from 0x${(0,a.RZ)("FungibleToken").replace("0x","")}
import FlowToken from 0x${(0,a.RZ)("FlowToken").replace("0x","")}

transaction(nftID: UInt64, price: UFix64) {
  let sellerCollection: &DapperCollectibles.Collection
  let paymentReceiver: Capability<&{FungibleToken.Receiver}>
  
  prepare(signer: AuthAccount) {
    // Get seller's collection reference
    self.sellerCollection = signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection)
      ?? panic("Could not borrow seller collection")
    
    // Get payment receiver capability
    self.paymentReceiver = signer.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    
    // Verify NFT exists in collection
    let nftRef = self.sellerCollection.borrowCollectible(id: nftID)
      ?? panic("NFT does not exist in collection")
  }
  
  execute {
    // Create listing on DapperMarket
    DapperMarket.createListing(
      nftID: nftID,
      price: price,
      seller: signer.address,
      paymentReceiver: self.paymentReceiver
    )
  }
}
`;async function l(e,t=[],s){try{let a=await r.mutate({cadence:e,args:t,limit:9999,authorizations:[r.currentUser().authorization]});console.log("Transaction submitted:",a),s?.onStatusUpdate&&r.tx(a).subscribe(s.onStatusUpdate);let n=await r.tx(a).onceSealed();return console.log("Transaction sealed:",n),s?.onSealed&&s.onSealed(a),a}catch(e){throw console.error("Transaction error:",e),e}}},73566:e=>{"use strict";e.exports=require("worker_threads")},74075:e=>{"use strict";e.exports=require("zlib")},76760:e=>{"use strict";e.exports=require("node:path")},77598:e=>{"use strict";e.exports=require("node:crypto")},78474:e=>{"use strict";e.exports=require("node:events")},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},86367:(e,t,s)=>{"use strict";s.d(t,{E:()=>n});var r=s(6662),a=s(91689);function n({className:e,...t}){return(0,r.jsx)("div",{"data-slot":"skeleton",className:(0,a.cn)("bg-accent animate-pulse rounded-md",e),...t})}},86458:(e,t,s)=>{"use strict";function r(){return null}s.r(t),s.d(t,{default:()=>r})},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},96517:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});let r=(0,s(51555).A)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[555,808,861,595,77,910,863,482,353],()=>s(64503));module.exports=r})();