if(typeof window.t!=="function"){window.t=function(k,o){return o&&o.defaultValue!=null?o.defaultValue:k;};}
const SocialFeed={container:null,events:[],isLoading:!1,hasMore:!0,offset:0,limit:20,observer:null,currentTab:"todos",selectedMedia:[],maxMedia:4,maxImageSize:5242880,maxVideoSize:52428800,maxVideoDuration:60,selectedImages:[],maxImages:4,currentUserId:null,currentHashtag:null,currentSearch:null,viewObserver:null,viewTimers:{},pendingViews:new Set,viewFlushInterval:null,feedSortMode:"relevant",hiddenAuthors:JSON.parse(localStorage.getItem("sf_hidden_authors")||"[]"),tabs:[{id:"todos",label:"Todos",icon:"fa-globe",filter:null},{id:"siguiendo",label:"Siguiendo",icon:"fa-user-plus",filter:"following"},{id:"trending",label:"Trending",icon:"fa-fire",filter:"trending"},{id:"grupos",label:"Grupos",icon:"fa-users",filter:"group_created,group_joined"},{id:"mercado",label:"Mercado",icon:"fa-shopping-bag",filter:"product_posted"},{id:"logros",label:"Logros",icon:"fa-trophy",filter:"milestone"}],eventTypes:{group_created:{icon:"fa-users",color:"#00d4ff",label:"Nuevo Grupo"},group_joined:{icon:"fa-user-plus",color:"#22d55e",label:"Nuevo Miembro"},product_posted:{icon:"fa-shopping-bag",color:"#fbbf24",label:"Producto"},lottery_result:{icon:"fa-dice",color:"#8b5cf6",label:"Sorteo"},prediction_shared:{icon:"fa-star",color:"#ec4899",label:"Prediccion"},prediction_hit:{icon:"fa-trophy",color:"#f59e0b",label:"Acierto"},milestone:{icon:"fa-trophy",color:"#f59e0b",label:"Logro"},user_post:{icon:"fa-comment-alt",color:"#00d4ff",label:"Publicación"},user_repost:{icon:"fa-retweet",color:"#22d55e",label:"Repost"},distribution_completed:{icon:"fa-gift",color:"#22d55e",label:"Distribución"},tanda_started:{icon:"fa-rocket",color:"#3b82f6",label:"Tanda Activa"},weekly_digest:{icon:"fa-newspaper",color:"#8b5cf6",label:"Resumen Semanal"},mia_tip:{icon:"fa-robot",color:"#3b82f6",label:"Tip de MIA"},mia_poll:{icon:"fa-poll",color:"#ec4899",label:"Encuesta MIA"},member_joined:{icon:"fa-user-plus",color:"#10b981",label:"Nuevo Miembro"},group_full:{icon:"fa-users",color:"#f59e0b",label:"Grupo Completo"},perfect_cycle:{icon:"fa-star",color:"#eab308",label:"Ciclo Perfecto"}},reactionEmojis:{fire:"🔥",clap:"👏",100:"💯",heart:"❤️",laugh:"😂",wow:"😮",sad:"😢"},defaultConfig:{icon:"fa-bell",color:"#6b7280",label:"Actividad"},hitoFamilies:{distribution_completed:"dinero",perfect_cycle:"dinero",tanda_started:"tanda",group_created:"tanda",group_joined:"tanda",group_full:"tanda",member_joined:"tanda",product_posted:"negocio",milestone:"logro"},_hitoFamily(t){return this.hitoFamilies[t]||""},_confianzaChip(actor,isAnon){if(isAnon||!actor)return"";var cf=actor.confianza;if(!cf||"object"!=typeof cf)return"";if(cf.is_coordinator){var n=("number"==typeof cf.cycles&&cf.cycles>0)?" \u00b7 "+cf.cycles+(1===cf.cycles?" ciclo":" ciclos"):"",role="female"===cf.gender?"Coordinadora":"Coordinador";return '<span class="sf-trust sf-trust-coord"><i class="fas fa-handshake" aria-hidden="true"></i> '+role+this.escapeHtml(n)+'</span>';}if(null!=cf.on_time_rate&&"number"==typeof cf.on_time_rate)return '<span class="sf-trust"><i class="fas fa-circle-check" aria-hidden="true"></i> '+this.escapeHtml(String(cf.on_time_rate))+'% a tiempo</span>';return"";},_renderContextCTA(e){var f=this._hitoFamily(e.event_type);if(!f)return"";var m={dinero:{href:"/explorar.html",icon:"fa-hand-holding-usd",label:"Explorar tandas"},tanda:{href:"/explorar.html",icon:"fa-user-plus",label:"Explorar tandas"},negocio:{href:"/marketplace-social.html",icon:"fa-store",label:"Ver el mercado"},logro:{href:"/explorar.html",icon:"fa-compass",label:"Explorar La Tanda"}}[f];if(!m)return"";return'<a class="sf-cta-ctx sf-cta-'+f+'" href="'+m.href+'"><i class="fas '+m.icon+'"></i><span>'+this.escapeHtml(m.label)+'</span></a>';},_ltcInit(){this._ltcInjectStyles();this._ltcFillGreeting();this._ltcAttach();if(document.getElementById("mainFeedHeader"))this._ltcRenderArrival();},_ltcInjectStyles(){if(document.getElementById("ltc-styles"))return;var s=document.createElement("style");s.id="ltc-styles";s.textContent=".ltc-launcher{font-family:'Inter',-apple-system,sans-serif;background:linear-gradient(145deg,#121734,#0a0e27);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:16px;color:#fff;margin:0 0 14px}.ltc-hi{display:flex;align-items:center;gap:12px;margin-bottom:14px}.ltc-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#061029;background:linear-gradient(135deg,#00d4ff,#8b5cf6);flex:0 0 auto}.ltc-hi-name{margin:0;font-weight:700;font-size:16px}.ltc-hi-sub{margin:2px 0 0;font-size:13px;color:rgba(255,255,255,.7)}.ltc-tiles{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:480px){.ltc-tiles{grid-template-columns:repeat(3,1fr)}}.ltc-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;min-height:88px;padding:14px;border-radius:14px;cursor:pointer;color:#fff;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);transition:transform .15s,border-color .15s;font-family:inherit}.ltc-tile:hover{transform:translateY(-2px)}.ltc-tile:focus-visible{outline:2px solid #00d4ff;outline-offset:2px}.ltc-ach:focus-visible,.ltc-primary:focus-visible,.ltc-wa:focus-visible,.ltc-sec:focus-visible,.ltc-sheet-x:focus-visible,.ltc-retry:focus-visible,.ltc-empty-cta:focus-visible,.ltc-step-cta:focus-visible{outline:2px solid #00d4ff;outline-offset:2px}.ltc-ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:17px}.ltc-t-title{font-weight:700;font-size:14.5px}.ltc-t-hint{font-size:12px;color:rgba(255,255,255,.65);line-height:1.3}.ltc-gold .ltc-ic{color:#ffd700;background:radial-gradient(circle at 50% 40%,rgba(255,215,0,.22),rgba(255,153,68,.05))}.ltc-gold:hover{border-color:rgba(255,215,0,.45)}.ltc-green .ltc-ic{color:#22d55e;background:radial-gradient(circle at 50% 40%,rgba(34,213,94,.22),rgba(34,213,94,.04))}.ltc-green:hover{border-color:rgba(34,213,94,.45)}.ltc-purple .ltc-ic{color:#a78bfa;background:radial-gradient(circle at 50% 40%,rgba(139,92,246,.24),rgba(139,92,246,.05))}.ltc-purple:hover{border-color:rgba(139,92,246,.5)}.ltc-sheet-ov{position:fixed;inset:0;background:rgba(2,6,20,.72);z-index:10080;display:flex;align-items:flex-end;justify-content:center;padding:0}@media(min-width:560px){.ltc-sheet-ov{align-items:center;padding:16px}}.ltc-sheet{font-family:'Inter',-apple-system,sans-serif;background:linear-gradient(145deg,#121734,#0a0e27);border:1px solid rgba(255,255,255,.1);border-radius:18px 18px 0 0;width:100%;max-width:560px;max-height:90vh;overflow:auto;color:#fff;padding:18px;box-sizing:border-box}@media(min-width:560px){.ltc-sheet{border-radius:18px}}.ltc-sheet-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.ltc-sheet-hd h3{margin:0;font-size:16px;font-weight:700}.ltc-sheet-x{background:none;border:none;color:rgba(255,255,255,.6);font-size:22px;line-height:1;cursor:pointer;min-width:44px;min-height:44px}.ltc-ach{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px;margin:8px 0;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:#fff;cursor:pointer;font-family:inherit;min-height:44px}.ltc-ach:hover{border-color:rgba(0,212,255,.4)}.ltc-ach-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:#ffd700;background:rgba(255,215,0,.14);flex:none}.ltc-ach-tx{font-size:13.5px;line-height:1.35}.ltc-sheet-ta{width:100%;min-height:92px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;padding:12px;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box}.ltc-primary{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#00d4ff,#8b5cf6);color:#061029;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;margin-top:12px}.ltc-primary[disabled]{opacity:.6;cursor:default}.ltc-wa{background:#22d55e;color:#04210f}.ltc-sec{display:block;width:100%;text-align:center;padding:12px;margin-top:8px;color:rgba(255,255,255,.85);text-decoration:none;font-size:13.5px;border-radius:10px;border:1px solid rgba(255,255,255,.08);box-sizing:border-box}.ltc-note{font-size:12px;color:rgba(255,255,255,.6);margin:10px 0 0;line-height:1.4}.ltc-empty-launch{text-align:center;padding:10px 4px}.ltc-empty-launch p{font-size:14px;color:rgba(255,255,255,.8);margin:0 0 12px}.ltc-sk{height:56px;border-radius:12px;margin:8px 0;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.09),rgba(255,255,255,.04));background-size:200% 100%;animation:ltcSk 1.2s ease-in-out infinite}@keyframes ltcSk{0%{background-position:200% 0}100%{background-position:-200% 0}}.ltc-err{color:#fca5a5;font-size:13px}.ltc-arr{font-family:'Inter',-apple-system,sans-serif;background:linear-gradient(145deg,#121734,#0a0e27);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:15px;margin:0 0 14px;color:#fff}.ltc-arr h3{margin:0 0 3px;font-size:15px;font-weight:800}.ltc-arr-sub{margin:0 0 12px;font-size:12.5px;color:rgba(255,255,255,.65)}.ltc-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:0 0 14px}.ltc-bar-fill{height:100%;border-radius:999px;background:linear-gradient(135deg,#00d4ff,#8b5cf6)}.ltc-step{display:flex;align-items:center;gap:11px;padding:9px 0}.ltc-step-ic{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:13px;flex:none}.ltc-step-done .ltc-step-ic{color:#22d55e;background:rgba(34,213,94,.14);border:1px solid rgba(34,213,94,.4)}.ltc-step-todo .ltc-step-ic{color:rgba(255,255,255,.5);border:1.5px solid rgba(255,255,255,.25)}.ltc-step-tx{font-size:13.5px;flex:1;min-width:0}.ltc-step-next{background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);border-radius:12px;padding:10px 12px;margin:6px 0}.ltc-step-cta{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:8px 15px;margin-top:9px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#8b5cf6);color:#061029;font-weight:700;font-size:13px;text-decoration:none}.ltc-soon{font-size:11.5px;color:rgba(255,255,255,.45);margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.ltc-soon span{background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.14);border-radius:8px;padding:4px 9px}.ltc-pulse{display:flex;flex-wrap:wrap;gap:16px;margin-top:2px}.ltc-pulse-item{min-width:0}.ltc-pulse-n{font-weight:800;font-size:19px}.ltc-pulse-l{font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;color:rgba(255,255,255,.6);font-weight:700}.ltc-works-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin-top:10px}.ltc-works-hd{font-weight:800;font-size:16px;color:#fff;line-height:1.2}.ltc-works-sub{font-size:12.5px;color:rgba(255,255,255,.7);margin-top:3px;line-height:1.35}.ltc-works-recent{font-size:12px;color:rgba(255,255,255,.6);margin-top:10px}.ltc-retry{display:inline-flex;align-items:center;min-height:44px;background:none;border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:9px;padding:7px 13px;cursor:pointer;font-family:inherit;font-size:12.5px}.ltc-empty-cta{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 18px;margin-top:14px;border-radius:10px;background:#22d55e;color:#04210f;font-weight:700;font-size:13.5px;border:none;cursor:pointer;font-family:inherit}@media(prefers-reduced-motion:reduce){.ltc-tile,.ltc-sk{transition:none;animation:none}.ltc-tile:hover{transform:none}}";document.head.appendChild(s);},_ltcUserObj(){var u={name:"",avatar:""};try{var r=localStorage.getItem("latanda_user")||sessionStorage.getItem("latanda_user");if(r){var j=JSON.parse(r);u.name=j.name||j.full_name||"";u.avatar=j.avatar_url||j.profile_image_url||"";}}catch(e){}return u;},_ltcFillGreeting(){var u=this._ltcUserObj();var fn=(u.name||"").trim().split(/\s+/)[0]||"";var n=document.getElementById("ltcHiName");if(n)n.textContent=fn?("Hola, "+fn):"Hola";var a=document.getElementById("ltcAvatar");if(a){var ini=(u.name||"").split(" ").map(function(x){return x&&x[0]?x[0]:"";}).join("").substring(0,2).toUpperCase();a.textContent=ini||"L";}},_ltcTok(){return localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";},_ltcHdr(){var t=this._ltcTok();return t?{Authorization:"Bearer "+t}:{};},_ltcAttach(){var self=this;if(!this.container||this._ltcBound)return;this._ltcBound=true;this.container.addEventListener("click",function(e){var b=e.target.closest("[data-ltc]");if(!b)return;e.preventDefault();e.stopPropagation();var a=b.getAttribute("data-ltc");if(a==="logro")self._ltcOpenLogro();else if(a==="invitar")self._ltcOpenInvitar();else if(a==="mia")self._ltcOpenMia();});},_ltcOpenMia(){if(window.MiaAssistant&&window.MiaAssistant.expand){try{window.MiaAssistant.expand();}catch(e){}var inp=document.getElementById("miaInput");if(inp)setTimeout(function(){try{inp.focus();}catch(e){}},150);}else{window.location.href="/mia.html";}},_ltcSheet(title){var self=this;this._ltcCloseSheet();var ov=document.createElement("div");ov.className="ltc-sheet-ov";ov.id="ltcSheetOv";ov.innerHTML='<div class="ltc-sheet" role="dialog" aria-modal="true" aria-label="'+this.escapeHtml(title)+'"><div class="ltc-sheet-hd"><h3>'+this.escapeHtml(title)+'</h3><button class="ltc-sheet-x" type="button" aria-label="Cerrar">&times;</button></div><div class="ltc-sheet-bd"></div></div>';document.body.appendChild(ov);document.body.style.overflow="hidden";ov.addEventListener("click",function(e){if(e.target===ov)self._ltcCloseSheet();});ov.querySelector(".ltc-sheet-x").addEventListener("click",function(){self._ltcCloseSheet();});this._ltcEsc=function(e){if(e.key==="Escape"){self._ltcCloseSheet();return;}if(e.key==="Tab"){var fo=ov.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])');fo=Array.prototype.filter.call(fo,function(el){return !el.disabled&&el.offsetParent!==null;});if(!fo.length)return;var first=fo[0],last=fo[fo.length-1];if(e.shiftKey){if(document.activeElement===first||!ov.contains(document.activeElement)){last.focus();e.preventDefault();}}else{if(document.activeElement===last||!ov.contains(document.activeElement)){first.focus();e.preventDefault();}}}};document.addEventListener("keydown",this._ltcEsc);setTimeout(function(){var fe=ov.querySelector('.ltc-sheet-bd button,.ltc-sheet-bd [href],.ltc-sheet-bd input,.ltc-sheet-bd textarea');(fe||ov.querySelector(".ltc-sheet-x")).focus();},0);return ov.querySelector(".ltc-sheet-bd");},_ltcCloseSheet(){var ov=document.getElementById("ltcSheetOv");if(ov)ov.remove();document.body.style.overflow="";if(this._ltcEsc){document.removeEventListener("keydown",this._ltcEsc);this._ltcEsc=null;}},async _ltcJSON(url){try{var r=await fetch(url,{headers:this._ltcHdr()});if(!r.ok)return null;return await r.json();}catch(e){return null;}},async _ltcOpenLogro(){var self=this;var bd=this._ltcSheet("Compartir un logro");bd.innerHTML='<div class="ltc-sk"></div><div class="ltc-sk"></div><div class="ltc-sk"></div>';if(!this._ltcTok()){bd.innerHTML='<p class="ltc-err">Iniciá sesión para compartir un logro.</p>';return;}var res=await Promise.all([this._ltcJSON("/api/groups/my-groups-pg"),this._ltcJSON("/api/mia/turn-approaching"),this._ltcJSON("/api/academia/progress"),this._ltcJSON("/api/rewards/onboarding/status")]);bd=document.querySelector("#ltcSheetOv .ltc-sheet-bd");if(!bd)return;var ach=this._ltcBuildAchievements(res[0],res[1],res[2],res[3]);if(!ach.length){bd.innerHTML='<div class="ltc-empty-launch"><p>Todavía no tenés un logro para compartir. Tu primer paso:</p><a class="ltc-step-cta" href="/explorar.html"><i class="fas fa-compass"></i> Unite a tu primera tanda</a></div>';return;}var html='<p class="ltc-arr-sub">Elegí algo real que lograste. Lo compartís con tus palabras.</p>';ach.forEach(function(aa,i){html+='<button class="ltc-ach" type="button" data-ach="'+i+'"><span class="ltc-ach-ic"><i class="fas '+aa.icon+'"></i></span><span class="ltc-ach-tx">'+self.escapeHtml(aa.label)+'</span></button>';});bd.innerHTML=html;this._ltcAch=ach;bd.querySelectorAll(".ltc-ach").forEach(function(b){b.addEventListener("click",function(){self._ltcLogroConfirm(parseInt(b.getAttribute("data-ach"),10));});});},_ltcBuildAchievements(mg,ta,ac,ob){var out=[];try{var groups=(mg&&mg.data&&mg.data.groups)||[];groups.forEach(function(g){if(!g)return;var st=g.my_membership_status||"active";var role=g.my_role||"member";var nm=g.name||"mi círculo";var gt=g.group_type||g.type||"";if(st!=="active")return;if(role==="creator"||role==="coordinator"||role==="admin"){out.push({icon:"fa-plus-circle",label:"Abrí un nuevo círculo: "+nm+". Buscando miembros de confianza."});}else{if(gt==="ahorro"){out.push({icon:"fa-users",label:"Me uní a mi círculo de ahorro "+nm+". Empiezo a construir."});}else{out.push({icon:"fa-users",label:"Me uní a "+nm+"."});}}});}catch(e){}try{var rc=ta&&ta.data&&ta.data.received;if(rc&&rc.group_name){out.unshift({icon:"fa-gift",label:"¡Cobré mi turno en "+rc.group_name+"! Mi constancia hecha capital."});}}catch(e){}try{if(ac&&ac.data&&ac.data.level0_completed){out.push({icon:"fa-graduation-cap",label:"Terminé el Nivel 0 de la Academia La Tanda. Aprendiendo a cuidar mi plata."});}}catch(e){}try{var tsk=ob&&ob.data&&ob.data.tasks;if(tsk&&tsk.profile_completed&&tsk.profile_completed.completed){out.push({icon:"fa-user-check",label:"Completé mi perfil en La Tanda."});}}catch(e){}out.forEach(function(o){o.text=o.label;});var seen={};return out.filter(function(o){if(seen[o.text])return false;seen[o.text]=1;return true;}).slice(0,8);},_ltcLogroConfirm(i){var self=this;var a=(this._ltcAch||[])[i];if(!a)return;var bd=document.querySelector("#ltcSheetOv .ltc-sheet-bd");if(!bd)return;bd.innerHTML='<p class="ltc-arr-sub">Así se verá. Podés ajustarlo con tus palabras.</p><textarea class="ltc-sheet-ta" id="ltcLogroTa" maxlength="500"></textarea><button class="ltc-primary" type="button" id="ltcLogroPub"><i class="fas fa-trophy"></i> Compartir logro</button><p class="ltc-note">Esto lo verán las demás personas en <span translate="no">La Tanda</span>, con tu nombre.</p>';var ta=document.getElementById("ltcLogroTa");if(ta){ta.value=a.text;ta.focus();}var btn=document.getElementById("ltcLogroPub");if(btn)btn.addEventListener("click",function(){self._ltcPublishLogro();});},async _ltcPublishLogro(){var self=this;var ta=document.getElementById("ltcLogroTa");var btn=document.getElementById("ltcLogroPub");if(!ta||!btn)return;var content=(ta.value||"").trim();if(!content){window.LaTandaPopup&&window.LaTandaPopup.showWarning&&window.LaTandaPopup.showWarning("Escribí algo sobre tu logro.");return;}if(content.length>500){window.LaTandaPopup&&window.LaTandaPopup.showWarning&&window.LaTandaPopup.showWarning("Máximo 500 caracteres.");return;}var tk=this._ltcTok();if(!tk){window.LaTandaPopup&&window.LaTandaPopup.showError&&window.LaTandaPopup.showError("Iniciá sesión para publicar.");return;}var old=btn.innerHTML;btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Publicando...';ta.disabled=true;var key;try{key=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():("ltc-"+Date.now()+"-"+Math.random().toString(36).slice(2));}catch(e){key="ltc-"+Date.now();}try{var r=await fetch("/api/feed/social",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":key,Authorization:"Bearer "+tk},body:JSON.stringify({content:content})});var j={};try{j=await r.json();}catch(_){}if(r.status===429){throw new Error((j&&(j.message||j.error))||"Esperá una hora para publicar de nuevo.");}if(!r.ok||!j.success){throw new Error((j&&(j.message||j.error))||"No se pudo publicar. Intentá de nuevo.");}if(j.data&&j.data.post){this.events.unshift(j.data.post);this.renderEvents();}this._ltcCloseSheet();window.LaTandaPopup&&window.LaTandaPopup.showSuccess&&window.LaTandaPopup.showSuccess("Logro compartido");}catch(e){btn.disabled=false;btn.innerHTML=old;ta.disabled=false;window.LaTandaPopup&&window.LaTandaPopup.showError&&window.LaTandaPopup.showError(e.message||"No se pudo publicar.");}},async _ltcOpenInvitar(){var self=this;var bd=this._ltcSheet("Invitá a tu círculo");bd.innerHTML='<div class="ltc-sk"></div><div class="ltc-sk"></div>';if(!this._ltcTok()){bd.innerHTML='<p class="ltc-err">Iniciá sesión para invitar a tu círculo.</p>';return;}var j=await this._ltcJSON("/api/referrals/my-code");bd=document.querySelector("#ltcSheetOv .ltc-sheet-bd");if(!bd)return;if(!j||!j.success||!j.referral_link){bd.innerHTML='<p class="ltc-err">No se pudo generar tu enlace.</p><button class="ltc-retry" type="button" id="ltcInvRetry">Reintentar</button>';var rb=document.getElementById("ltcInvRetry");if(rb)rb.addEventListener("click",function(){self._ltcOpenInvitar();});return;}var link=j.referral_link;var reg=(j.stats&&j.stats.registered)||0;var msg="Te invito a La Tanda, donde ahorramos en grupo con confianza. Registrate gratis con mi enlace: "+link;var wa="https://wa.me/?text="+encodeURIComponent(msg);var proof=reg>0?("Ya invitaste a "+reg+" persona"+(reg===1?"":"s")+" que se registr"+(reg===1?"ó":"aron")+"."):"Traé a la primera persona de tu círculo.";var html='<p class="ltc-arr-sub">Compartí tu enlace por WhatsApp. Se registran gratis con tu invitación.</p>';html+='<button class="ltc-primary ltc-wa" type="button" id="ltcWaBtn"><i class="fab fa-whatsapp"></i> Invitar por WhatsApp</button>';html+='<p class="ltc-note">'+self.escapeHtml(proof)+'</p>';html+='<a class="ltc-sec" href="/invitaciones.html">Ver todas mis invitaciones</a>';html+='<a class="ltc-sec" href="/gestionar.html">Gestionar mi círculo</a>';bd.innerHTML=html;var wb=document.getElementById("ltcWaBtn");if(wb)wb.addEventListener("click",function(){window.open(wa,"_blank","noopener");});},_ltcRenderArrival(){var self=this;var mount=document.getElementById("ltcArrival");if(!mount)return;if(!this._ltcTok()){mount.innerHTML="";this._ltcAppendPulse(mount);return;}mount.innerHTML='<div class="ltc-arr"><div class="ltc-sk"></div><div class="ltc-sk"></div></div>';this._ltcJSON("/api/rewards/onboarding/status").then(function(j){self._ltcRenderSteps(mount,j);});},_ltcRenderSteps(mount,j){var self=this;if(!j||!j.success||!j.data||!j.data.tasks){mount.innerHTML='<div class="ltc-arr"><h3>Tus próximos pasos</h3><p class="ltc-arr-sub">No se pudo cargar ahora.</p><button class="ltc-retry" type="button" id="ltcStepRetry">Reintentar</button></div>';var rb=document.getElementById("ltcStepRetry");if(rb)rb.addEventListener("click",function(){self._ltcRenderArrival();});self._ltcAppendPulse(mount);return;}var t=j.data.tasks;var order=[["account_created","Creá tu cuenta",null],["email_verified","Verificá tu correo","/perfil.html"],["profile_completed","Completá tu perfil","/perfil.html"],["first_tanda","Unite a una tanda","/explorar.html"]];var done=0;order.forEach(function(o){if(t[o[0]]&&t[o[0]].completed)done++;});var total=order.length;var pct=Math.round(done/total*100);var allDone=done>=total;var html='<div class="ltc-arr"><h3>Tus próximos pasos</h3><p class="ltc-arr-sub">'+done+' de '+total+' listo</p><div class="ltc-bar"><div class="ltc-bar-fill" style="width:'+pct+'%"></div></div>';if(allDone){html+='<p class="ltc-arr-sub">Ya diste tus primeros pasos. Seguí construyendo:</p><a class="ltc-step-cta" href="/explorar.html"><i class="fas fa-compass"></i> Explorar grupos</a>';}else{var nextShown=false;order.forEach(function(o){var tk=t[o[0]];var ok=tk&&tk.completed;if(ok){html+='<div class="ltc-step ltc-step-done"><span class="ltc-step-ic"><i class="fas fa-check"></i></span><span class="ltc-step-tx">'+self.escapeHtml(o[1])+'</span></div>';}else if(!nextShown&&o[2]){nextShown=true;html+='<div class="ltc-step-next"><div class="ltc-step ltc-step-todo" style="padding-bottom:0"><span class="ltc-step-ic"></span><span class="ltc-step-tx"><strong>'+self.escapeHtml(o[1])+'</strong></span></div><a class="ltc-step-cta" href="'+o[2]+'">Hacerlo ahora</a></div>';}else{html+='<div class="ltc-step ltc-step-todo"><span class="ltc-step-ic"></span><span class="ltc-step-tx">'+self.escapeHtml(o[1])+'</span></div>';}});}html+='<div class="ltc-soon"><span>Próximamente: Primer depósito</span></div></div>';mount.innerHTML=html;self._ltcAppendPulse(mount);},_ltcAppendPulse(mount){var self=this;Promise.all([fetch("/api/public/metrics").then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),fetch("/api/feed/social?limit=20").then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})]).then(function(res){var m=res[0]||{};var pay=m.completed_distributions;if(pay==null)return;var reg=m.registered_users;var recent="";try{var evs=(res[1]&&res[1].data&&res[1].data.events)||[];var now=Date.now();var win=1209600000;var pri={distribution_completed:3,group_created:2,group_joined:1};var bestp=0,best="";evs.forEach(function(e){var pr=pri[e&&e.event_type];if(!pr)return;var t=Date.parse(e.created_at||e.last_activity_at||"");if(isNaN(t)||(now-t)>win)return;if(pr>bestp){bestp=pr;best=e.event_type;}});if(best==="distribution_completed")recent="Hace poco: se pagó un turno en un círculo.";else if(best==="group_created")recent="Hace poco: alguien abrió un círculo.";else if(best==="group_joined")recent="Hace poco: alguien se unió a un círculo.";}catch(e){}var html='<div class="ltc-arr ltc-works"><h3><span translate="no">La Tanda</span> ya funciona</h3>';html+='<div class="ltc-works-card"><div class="ltc-works-hd">'+pay+' turnos pagados</div><div class="ltc-works-sub">Personas reales que recibieron su dinero completo. Ni uno falló.</div></div>';html+='<div class="ltc-works-card"><div class="ltc-works-hd">Círculos que llevan meses andando</div><div class="ltc-works-sub">Hasta 21 turnos cumplidos, sin saltarse ninguno.</div></div>';if(recent)html+='<p class="ltc-works-recent">'+recent+'</p>';if(reg!=null&&reg>=500)html+='<p class="ltc-works-recent">+500 personas registradas y sumando.</p>';html+='</div>';var el=document.createElement("div");el.innerHTML=html;if(el.firstChild)mount.appendChild(el.firstChild);});},init(e){if(this.initialized)return;if(this.container=document.getElementById(e),!this.container)return;this.loadCurrentUserId();try{const e=sessionStorage.getItem("socialFeedTab");e&&this.tabs.find(t=>t.id===e)&&(this.currentTab=e)}catch(e){}this.render();const t=new URLSearchParams(window.location.search),a=t.get("hashtag");a&&(this.currentHashtag=a,setTimeout(()=>this.showHashtagFilter(a),100)),this.deepLinkEventId=t.get("event")||null,window.addEventListener("popstate",function(){var e=document.getElementById("postDetailOverlay");e&&(e.classList.remove("pd-active"),setTimeout(function(){e.remove(),document.body.style.overflow=""},250))});const s=t.get("shared_title")||"",i=t.get("shared_text")||"",o=t.get("shared_url")||"";if(s||i||o){this._pendingShare=[s,i,o].filter(Boolean).join(" ");const e=window.location.pathname;window.history.replaceState({},"",e)}this._consumePendingShare(),this.loadEvents(),this.loadStories(),this.setupIntersectionObserver(),this.setupViewTracking(),this.attachEngagementHandlers(),this.attachTabHandlers(),this.attachPostMenuHandlers(),this.initialized=!0},loadCurrentUserId(){try{const e=localStorage.getItem("latanda_user")||sessionStorage.getItem("latanda_user");if(e){const t=JSON.parse(e);this.currentUserId=t.id||t.user_id||null}this.currentUserId||(this.currentUserId=localStorage.getItem("user_id")||localStorage.getItem("userId")||null)}catch(e){}},render(){if(!this.container)return;const e=this.tabs.map(e=>'<button class="feed-tab '+(e.id===this.currentTab?"active":"")+'" data-tab="'+e.id+'"><i class="fas '+e.icon+'"></i><span>'+e.label+"</span></button>").join("");let t="Usuario",a="";try{const e=localStorage.getItem("latanda_user")||sessionStorage.getItem("latanda_user");if(e){const s=JSON.parse(e);t=s.name||s.full_name||"Usuario",a=s.avatar_url||s.profile_image_url||""}}catch(e){}const s=t.split(" ").map(e=>e[0]).join("").substring(0,2).toUpperCase(),i=a?'<img src="'+this.escapeHtml(a)+'" alt="'+this.escapeHtml(t)+'" class="avatar-fallback-img">':"";this.container.innerHTML='<div class="social-feed-wrapper"><div class="stories-bar" id="storiesBar"><div class="stories-scroll"></div></div><div class="feed-tabs-container"><div class="feed-tabs" id="feedTabs">'+e+'</div><div class="sf-sort-toggle" id="sfSortToggle"><button class="sf-sort-btn'+("relevant"===this.feedSortMode?" active":"")+'" data-sort="relevant"><i class="fas fa-fire-alt"></i> Relevante</button><button class="sf-sort-btn'+("recent"===this.feedSortMode?" active":"")+'" data-sort="recent"><i class="fas fa-clock"></i> Reciente</button></div><div class="sf-sort-indicator" id="sfSortIndicator" style="display:none;"><i class="fas fa-magic"></i> Para ti — personalizado segun tu actividad</div></div><section class="ltc-launcher" id="ltcLauncher" aria-label="Qué querés hacer"><header class="ltc-hi"><span class="ltc-avatar" id="ltcAvatar" aria-hidden="true">L</span><div><p class="ltc-hi-name" id="ltcHiName">Hola</p><p class="ltc-hi-sub">¿Qué querés hacer hoy?</p></div></header><div class="ltc-tiles"><button class="ltc-tile ltc-gold" type="button" data-ltc="logro"><span class="ltc-ic"><i class="fas fa-trophy" aria-hidden="true"></i></span><span class="ltc-t-title">Compartir un logro</span><span class="ltc-t-hint">Contá algo real que lograste</span></button><button class="ltc-tile ltc-green" type="button" data-ltc="invitar"><span class="ltc-ic"><i class="fas fa-user-plus" aria-hidden="true"></i></span><span class="ltc-t-title">Invitá a tu círculo</span><span class="ltc-t-hint">Traé a alguien de confianza</span></button><button class="ltc-tile ltc-purple" type="button" data-ltc="mia"><span class="ltc-ic"><i class="fas fa-robot" aria-hidden="true"></i></span><span class="ltc-t-title">Preguntá a <span translate="no">MIA</span></span><span class="ltc-t-hint">Tu asistente te ayuda</span></button></div></section><div class="social-feed-list" id="socialFeedList"><div class="social-feed-loading"><i class="fas fa-spinner fa-spin"></i><span>Cargando actividad...</span></div></div><div id="socialFeedSentinel" class="social-feed-sentinel"></div></div><div class="post-edit-modal" id="postEditModal" style="display:none;"><div class="post-edit-modal-overlay"></div><div class="post-edit-modal-content"><div class="post-edit-modal-header"><h3>Editar publicacion</h3><button class="post-edit-modal-close" id="postEditModalClose"><i class="fas fa-times"></i></button></div><div class="post-edit-modal-body"><textarea class="post-edit-textarea" id="postEditTextarea" placeholder="¿Qué está pasando?" maxlength="500"></textarea><div class="post-edit-char-count"><span id="postEditCharCount">0</span>/500</div></div><div class="post-edit-modal-footer"><button class="post-edit-cancel" id="postEditCancel">Cancelar</button><button class="post-edit-save" id="postEditSave">Guardar</button></div></div></div><div class="media-lightbox" id="mediaLightbox"><div class="lightbox-backdrop"></div><button class="lightbox-close" id="lightboxClose"><i class="fas fa-times"></i></button><div class="lightbox-counter" id="lightboxCounter"></div><button class="lightbox-nav lightbox-prev" id="lightboxPrev"><i class="fas fa-chevron-left"></i></button><button class="lightbox-nav lightbox-next" id="lightboxNext"><i class="fas fa-chevron-right"></i></button><div class="lightbox-content" id="lightboxContent"><img id="lightboxImg" src="" alt=""><video id="lightboxVideo" controls playsinline preload="auto" style="display:none;max-width:100%;max-height:90vh;object-fit:contain;"></video></div></div>',this.setupImageHandlers(),this.setupVideoOverlays(),this.setupAutoResize(),this.setupLinkPreview(),this.setupMentionAutocomplete(),this.setupEditModalHandlers(),this.setupSearch(),this.setupEmojiPicker(),this.setupPollCreator(),this.setupGifSelector(),this.setupLocation(),this.setupIncognito(),this.setupLightbox(),this._ltcInit()},setupImageHandlers(){const e=document.getElementById("composeMediaBtn"),t=document.getElementById("composeMediaMenu"),a=document.getElementById("composeMediaInput"),s=document.getElementById("composeCameraInput"),i=document.getElementById("composeSubmit"),o=document.getElementById("composeImagesPreview");e&&t&&e.addEventListener("click",e=>{e.stopPropagation(),this.selectedImages.length>=this.maxMedia?window.LaTandaPopup&&window.LaTandaPopup.showWarning("Maximo "+this.maxMedia+" archivos"):window.innerWidth<=768?a&&a.click():t.classList.toggle("show")}),t&&t.addEventListener("click",e=>{const i=e.target.closest(".compose-media-option");if(!i)return;e.stopPropagation(),t.classList.remove("show");const o=i.dataset.type;if("gallery"===o&&a&&a.click(),"photo"===o&&(this.isMobileDevice()?s&&s.click():this.openCameraModal("photo")),"video-capture"===o)if(this.isMobileDevice()){const e=document.getElementById("composeVideoCaptureInput");e&&e.click()}else this.openCameraModal("video")}),document.addEventListener("click",e=>{t&&!e.target.closest(".compose-media-wrapper")&&t.classList.remove("show")}),a&&a.addEventListener("change",e=>this.handleMediaSelect(e)),s&&s.addEventListener("change",e=>this.handleMediaSelect(e));const n=document.getElementById("composeVideoCaptureInput");n&&n.addEventListener("change",e=>this.handleMediaSelect(e)),o&&o.addEventListener("click",e=>{const t=e.target.closest(".remove-image");if(t){const e=parseInt(t.dataset.index);this.removeImage(e)}}),i&&i.addEventListener("click",()=>this.handleCompose())},setupEditModalHandlers(){const e=document.getElementById("postEditModal"),t=e?e.querySelector(".post-edit-modal-overlay"):null,a=document.getElementById("postEditModalClose"),s=document.getElementById("postEditCancel"),i=document.getElementById("postEditSave"),o=document.getElementById("postEditTextarea"),n=document.getElementById("postEditCharCount");t&&t.addEventListener("click",()=>this.closeEditModal()),a&&a.addEventListener("click",()=>this.closeEditModal()),s&&s.addEventListener("click",()=>this.closeEditModal()),i&&i.addEventListener("click",()=>this.saveEdit()),o&&n&&o.addEventListener("input",()=>{n.textContent=o.value.length})},handleImageSelect(e){this.handleMediaSelect(e)},async handleMediaSelect(e){const t=Array.from(e.target.files);if(!t.length)return;const a=["image/jpeg","image/png","image/gif","image/webp"],s=["video/mp4","video/quicktime","video/webm","video/mov"],i=this.maxImageSize||5242880,o=this.maxVideoSize||52428800,n=this.maxVideoDuration||60;for(const e of t){if(this.selectedImages.length>=(this.maxMedia||4)){window.LaTandaPopup&&window.LaTandaPopup.showWarning("Maximo "+(this.maxMedia||4)+" archivos");break}const t=a.includes(e.type),r=s.includes(e.type)||e.type.startsWith("video/");if(t||r)if(t&&e.size>i)window.LaTandaPopup&&window.LaTandaPopup.showWarning(e.name+": imagen excede 5MB");else if(r&&e.size>o)window.LaTandaPopup&&window.LaTandaPopup.showWarning(e.name+": video excede 50MB");else{if(r)try{if(await this.getVideoDuration(e)>n){window.LaTandaPopup&&window.LaTandaPopup.showWarning(e.name+": video excede "+n+" segundos");continue}}catch(e){}this.selectedImages.push({file:e,previewUrl:URL.createObjectURL(e),type:r?"video":"image"})}else window.LaTandaPopup&&window.LaTandaPopup.showWarning(e.name+": formato no soportado")}e.target.value="",this.renderImagePreviews(),this.updateImageButton()},getVideoDuration:e=>new Promise((t,a)=>{const s=document.createElement("video");s.preload="metadata",s.onloadedmetadata=()=>{URL.revokeObjectURL(s.src),t(s.duration)},s.onerror=a,s.src=URL.createObjectURL(e)}),renderImagePreviews(){const e=document.getElementById("composeImagesPreview");if(e){if(0===this.selectedImages.length)return e.style.display="none",void(e.innerHTML="");e.style.display="grid",e.className="compose-images-preview preview-"+this.selectedImages.length,e.innerHTML=this.selectedImages.map((e,t)=>"video"===e.type||e.file&&e.file.type.startsWith("video/")?'<div class="preview-item preview-video"><video src="'+e.previewUrl+'" muted playsinline preload="auto"></video><div class="video-badge"><i class="fas fa-play"></i></div><button class="remove-image" data-index="'+t+'" title="Eliminar"><i class="fas fa-times"></i></button></div>':'<div class="preview-item"><img src="'+e.previewUrl+'" alt="Preview '+(t+1)+'"><button class="remove-image" data-index="'+t+'" title="Eliminar"><i class="fas fa-times"></i></button></div>').join("")+'<span class="compose-image-count">'+this.selectedImages.length+"/"+(this.maxMedia||4)+"</span>"}},removeImage(e){e<0||e>=this.selectedImages.length||(URL.revokeObjectURL(this.selectedImages[e].previewUrl),this.selectedImages.splice(e,1),this.renderImagePreviews(),this.updateImageButton())},clearAllImages(){this.selectedImages.forEach(e=>URL.revokeObjectURL(e.previewUrl)),this.selectedImages=[],this.renderImagePreviews(),this.updateImageButton()},updateImageButton(){const e=document.getElementById("composeMediaBtn");e&&(this.selectedImages.length>0?e.classList.add("active"):e.classList.remove("active"))},showUploadProgress(e,t){let a=document.getElementById("composeUploadProgress");if(!a&&e){a=document.createElement("div"),a.id="composeUploadProgress",a.className="upload-progress-bar",a.innerHTML='<div class="upload-progress-fill"></div><span class="upload-progress-text">0%</span>';const e=document.getElementById("composeImagesPreview");e&&e.parentElement&&e.parentElement.insertBefore(a,e.nextSibling)}if(a)if(e){a.style.display="block";const e=a.querySelector(".upload-progress-fill"),s=a.querySelector(".upload-progress-text");e&&(e.style.width=Math.min(t,100)+"%"),s&&(s.textContent=Math.round(t)+"%")}else a.style.display="none"},uploadFileWithProgress(e,t,a,s,i){return new Promise((o,n)=>{const r=new XMLHttpRequest;r.open("POST",t),r.setRequestHeader("Authorization","Bearer "+a),r.upload.onprogress=e=>{if(e.lengthComputable){const t=e.loaded/e.total*100,a=s/i*100+t/i;this.showUploadProgress(!0,a)}},r.onload=()=>{try{const e=JSON.parse(r.responseText);r.status>=200&&r.status<300&&e.success&&e.data&&e.data.url?o(e):n(new Error(e.message||e.error||"Error al subir archivo"))}catch(e){n(new Error("Respuesta invalida del servidor"))}},r.onerror=()=>n(new Error("Error de red al subir archivo")),r.ontimeout=()=>n(new Error("Tiempo de espera agotado")),r.timeout=12e4,r.send(e)})},async uploadImages(){if(0===this.selectedImages.length)return[];const e=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";if(!e)throw new Error("Debes iniciar sesion para subir archivos");const t=[],a=this.selectedImages.length;this.showUploadProgress(!0,0);for(let s=0;s<a;s++){const i=this.selectedImages[s],o="video"===i.type||i.file&&i.file.type.startsWith("video/"),n=new FormData;n.append(o?"video":"image",i.file);const r=o?"/api/upload/social-video":"/api/upload/social-image",l=await this.uploadFileWithProgress(n,r,e,s,a);t.push({url:l.data.url,type:o?"video":"image"})}return this.showUploadProgress(!0,100),t},async handleCompose(){const e=document.getElementById("composeInput"),a=document.getElementById("composeSubmit"),s=e?e.value.trim():"",i=this.getPollData();if(s||0!==this.selectedImages.length||this.selectedGif||i)if(i&&i.options.length<2)window.LaTandaPopup&&window.LaTandaPopup.showWarning("La encuesta necesita al menos 2 opciones");else if(s.length>500)window.LaTandaPopup&&window.LaTandaPopup.showWarning("El texto no puede exceder 500 caracteres");else{a&&(a.disabled=!0,a.innerHTML='<i class="fas fa-spinner fa-spin"></i>');try{const a=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";if(!a)return void(window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_to_publish",{defaultValue:"Debes iniciar sesion para publicar"})));let o=[];if(this.selectedImages.length>0)try{o=await this.uploadImages()}catch(e){return this.showUploadProgress(!1,0),void(window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.upload_error",{defaultValue:"Error al subir archivos. Intenta de nuevo."})))}let n=null;if(this.selectedGif)n=this.selectedGif;else if(o.length>0){const e=o.map(e=>"string"==typeof e?e:e.url);n=1===e.length?e[0]:JSON.stringify(e)}const r={content:s||(i?"Encuesta":"(imagen)"),image_url:n};i&&(r.poll=i),this.selectedGif?r.media_type="gif":o.some(e=>"object"==typeof e&&"video"===e.type)&&(r.media_type="video"),this.selectedLocation&&(r.location=this.selectedLocation),this.incognitoMode&&(r.is_anonymous=!0),this._linkPreviewData&&(r.link_preview=this._linkPreviewData);const l=await fetch("/api/feed/social",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+a},body:JSON.stringify(r)}),c=await l.json();if(!c.success)throw new Error(c.message||c.error||"Error al publicar");{this.showUploadProgress(!1,0),e.value="",this.clearAllImages(),this.clearLinkPreview(),this.selectedGif=null,this.selectedLocation=null,this.incognitoMode=!1;const a=document.getElementById("locationInput");a&&(a.value="");const s=document.getElementById("composeLocationBtn");s&&s.classList.remove("active");const i=document.getElementById("composeIncognitoBtn");i&&i.classList.remove("active");const o=document.getElementById("composeIncognitoBar");o&&(o.style.display="none"),this.closePollPanel(),this.closeEmojiPanel(),this.closeGifPanel(),this.closeLocationPanel();const n=document.getElementById("pollOptionsList");n&&(n.innerHTML='<input class="poll-option-input" type="text" placeholder="Opcion 1" maxlength="80"><input class="poll-option-input" type="text" placeholder="Opcion 2" maxlength="80">');const r=document.getElementById("pollAddOption");r&&(r.style.display=""),this.events.unshift(c.data.post),this.renderEvents(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess(t("messages.post_created",{defaultValue:"Publicación creada!"}))}}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.publish_error",{defaultValue:"Error al publicar. Intenta de nuevo."}))}finally{a&&(a.disabled=!1,a.innerHTML=t("buttons.publish",{defaultValue:"Publicar"}))}}else window.LaTandaPopup&&window.LaTandaPopup.showWarning("Escribe algo o selecciona una imagen")},attachTabHandlers(){const e=document.getElementById("feedTabs");if(!e)return;const t=document.getElementById("sfSortToggle");t&&t.addEventListener("click",e=>{const a=e.target.closest(".sf-sort-btn");if(!a)return;const s=a.dataset.sort;s!==this.feedSortMode&&(this.feedSortMode=s,t.querySelectorAll(".sf-sort-btn").forEach(e=>e.classList.remove("active")),a.classList.add("active"),this.loadEvents(!0))}),e.addEventListener("click",t=>{const a=t.target.closest(".feed-tab");if(!a)return;const s=a.dataset.tab;if(s===this.currentTab)return;e.querySelectorAll(".feed-tab").forEach(e=>e.classList.remove("active"));const i=document.getElementById("sfSortToggle");i&&(i.style.display="trending"===s||"siguiendo"===s?"none":"flex"),a.classList.add("active"),this.currentTab=s;try{sessionStorage.setItem("socialFeedTab",s)}catch(t){}this.loadEvents(!0)})},attachPostMenuHandlers(){this.container&&(document.addEventListener("click",e=>{e.target.closest(".post-menu-container")||document.querySelectorAll(".post-menu-dropdown.show").forEach(e=>{e.classList.remove("show")})}),this.container.addEventListener("click",e=>{const t=e.target.closest("[data-href]");if(t)return void(window.location.href=t.dataset.href);const a=e.target.closest(".post-menu-btn");if(a)return e.preventDefault(),e.stopPropagation(),void this.togglePostMenu(a);const s=e.target.closest(".post-menu-edit");if(s){e.preventDefault();const t=s.dataset.id;return void this.openEditModal(t)}const i=e.target.closest(".post-menu-delete");if(i){e.preventDefault();const t=i.dataset.id;return void this.confirmDelete(t)}}))},reportPost(postId){if(!postId)return;const reasons=[{v:"inappropriate",l:"Contenido inapropiado"},{v:"spam",l:"Spam o engano"},{v:"harassment",l:"Acoso o discurso de odio"},{v:"misinformation",l:"Informacion falsa"},{v:"csam",l:"Contenido de abuso sexual infantil (CSAM)"},{v:"other",l:"Otro"}];document.querySelectorAll(".sf-report-modal").forEach(e=>e.remove());const ov=document.createElement("div");ov.className="sf-report-modal";ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px";const opts=reasons.map(r=>'<button class="sf-report-reason" data-reason="'+r.v+'" style="display:block;width:100%;text-align:left;padding:12px 14px;margin:6px 0;border:1px solid #2a2a3a;border-radius:10px;background:#15151f;color:#e5e7eb;cursor:pointer;font-size:14px">'+this.escapeHtml(r.l)+'</button>').join("");ov.innerHTML='<div role="dialog" aria-modal="true" style="background:#0d0d14;border:1px solid #2a2a3a;border-radius:14px;max-width:420px;width:100%;padding:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="margin:0;font-size:16px;color:#fff">Reportar publicacion</h3><button class="sf-report-close" aria-label="Cerrar" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer">&times;</button></div><p style="margin:0 0 6px;color:#9ca3af;font-size:13px">Selecciona el motivo del reporte:</p>'+opts+'</div>';document.body.appendChild(ov);const close=()=>ov.remove();ov.addEventListener("click",e=>{if(e.target===ov)close();});const cb=ov.querySelector(".sf-report-close");if(cb)cb.addEventListener("click",close);ov.querySelectorAll(".sf-report-reason").forEach(b=>{b.addEventListener("click",()=>{const reason=b.dataset.reason;close();this._submitReport(postId,reason);});});},async _submitReport(postId,reason){const tk=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";if(!tk){window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_required",{defaultValue:"Debes iniciar sesion para reportar"}));return;}try{const r=await fetch("/api/feed/social/"+encodeURIComponent(postId)+"/report",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tk},body:JSON.stringify({reason})});let d={};try{d=await r.json();}catch(_){}if(r.status===429){window.LaTandaPopup&&window.LaTandaPopup.showWarning(d.message||d.error||"Limite de reportes alcanzado. Intenta mas tarde.");return;}if(r.status===409){window.LaTandaPopup&&window.LaTandaPopup.showInfo(d.message||d.error||"Ya reportaste esta publicacion. Estamos revisando.");return;}if(!r.ok||!d.success){throw new Error(d.message||d.error||"No se pudo enviar el reporte");}window.LaTandaPopup&&window.LaTandaPopup.showSuccess(t("messages.report_sent",{defaultValue:"Reporte enviado, gracias."}));}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError(e.message||"Error al enviar reporte. Intenta de nuevo.");}},togglePostMenu(e){const t=e.nextElementSibling;t&&(document.querySelectorAll(".post-menu-dropdown.show").forEach(e=>{e!==t&&e.classList.remove("show")}),t.classList.toggle("show"))},confirmDelete(e){document.querySelectorAll(".post-menu-dropdown.show").forEach(e=>{e.classList.remove("show")}),window.LaTandaPopup&&window.LaTandaPopup.showConfirm?window.LaTandaPopup.showConfirm("¿Eliminar publicacion? Esta accion no se puede deshacer.",()=>this.deletePost(e)):confirm("¿Eliminar esta publicacion? Esta accion no se puede deshacer.")&&this.deletePost(e)},async deletePost(e){const a=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";if(a)try{const s=await fetch("/api/feed/social/"+e,{method:"DELETE",headers:{Authorization:"Bearer "+a}}),i=await s.json();if(!i.success)throw new Error(i.message||i.error||"Error al eliminar");this.events=this.events.filter(t=>String(t.id)!==e),this.renderEvents(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess(t("messages.post_deleted",{defaultValue:"Publicación eliminada"}))}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.delete_error",{defaultValue:"Error al eliminar. Intenta de nuevo."}))}else window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_required",{defaultValue:"Debes iniciar sesion"}))},openEditModal(e){document.querySelectorAll(".post-menu-dropdown.show").forEach(e=>{e.classList.remove("show")});const t=this.events.find(t=>String(t.id)===e);if(!t)return;const a=document.getElementById("postEditModal"),s=document.getElementById("postEditTextarea"),i=document.getElementById("postEditCharCount");if(!a||!s)return;a.dataset.eventId=e;const o=t.description||t.title||"";s.value=o,i.textContent=o.length,a.style.display="flex",s.focus()},closeEditModal(){const e=document.getElementById("postEditModal");e&&(e.style.display="none",e.dataset.eventId="")},async saveEdit(){const e=document.getElementById("postEditModal"),a=document.getElementById("postEditTextarea"),s=document.getElementById("postEditSave");if(!e||!a)return;const i=e.dataset.eventId,o=a.value.trim();if(!i)return;if(!o)return void(window.LaTandaPopup&&window.LaTandaPopup.showWarning("El contenido no puede estar vacio"));if(o.length>500)return void(window.LaTandaPopup&&window.LaTandaPopup.showWarning("El texto no puede exceder 500 caracteres"));const n=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";if(n){s&&(s.disabled=!0,s.innerHTML='<i class="fas fa-spinner fa-spin"></i>');try{const e=await fetch("/api/feed/social/"+i,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+n},body:JSON.stringify({content:o})}),a=await e.json();if(!a.success)throw new Error(a.message||a.error||"Error al actualizar");{const e=this.events.findIndex(e=>String(e.id)===i);-1!==e&&(this.events[e].title=o.substring(0,100),this.events[e].description=o),this.renderEvents(),this.closeEditModal(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess(t("messages.post_updated",{defaultValue:"Publicación actualizada"}))}}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.update_error",{defaultValue:"Error al actualizar. Intenta de nuevo."}))}finally{s&&(s.disabled=!1,s.innerHTML="Guardar")}}else window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_required",{defaultValue:"Debes iniciar sesion"}))},async loadEvents(e=!1){if(!this.isLoading&&(this.hasMore||e)){e&&(this.events=[],this.offset=0,this.hasMore=!0),this.isLoading=!0,this.showLoadingIndicator();try{const e=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"",t=this.tabs.find(e=>e.id===this.currentTab);let a;a="trending"===t.filter?"/api/feed/social/trending?limit="+this.limit+"&offset="+this.offset:"following"===t.filter?"/api/feed/social/following?limit="+this.limit+"&offset="+this.offset:t.filter?"/api/feed/social?limit="+this.limit+"&offset="+this.offset+"&types="+t.filter+"&sort="+this.feedSortMode:"/api/feed/social?limit="+this.limit+"&offset="+this.offset+"&sort="+this.feedSortMode,this.currentHashtag&&(a+=(a.includes("?")?"&":"?")+"hashtag="+encodeURIComponent(this.currentHashtag)),this.currentSearch&&(a+=(a.includes("?")?"&":"?")+"search="+encodeURIComponent(this.currentSearch));const s=await fetch(a,{headers:e?{Authorization:"Bearer "+e}:{}});if(!s.ok)throw new Error("HTTP "+s.status);const i=await s.json();if(i.success&&i.data){const e=i.data.events||[];this.events=[...this.events,...e],this.hasMore=!!i.data.pagination&&i.data.pagination.has_more,this.offset+=e.length;const t=document.getElementById("sfSortIndicator");if(t){const e="relevant"===i.data.sort&&(localStorage.getItem("auth_token")||localStorage.getItem("authToken"));t.style.display=e&&this.offset<=this.limit?"flex":"none"}this.renderEvents()}else this.renderError()}catch(e){this.renderError()}finally{this.isLoading=!1}}},renderEvents(){const e=document.getElementById("socialFeedList");if(!e)return;this._collapseRecien&&this._collapseRecien();if(0===this.events.length){const t=this.tabs.find(e=>e.id===this.currentTab);let a="Todavía no hay movimiento en tu red. Cuando alguien de tu círculo abra una tanda o cobre su turno, lo verás acá.",s=t?t.icon:"fa-inbox";return"siguiendo"===this.currentTab?(a="Sigue a otros usuarios para ver sus publicaciones aqui",s="fa-user-plus"):"todos"!==this.currentTab&&(a="No hay actividad en esta categoria"),void(e.innerHTML='<div class="social-feed-empty"><i class="fas '+s+'"></i><p>No hay actividad '+("todos"!==this.currentTab?"en esta categoria":"reciente")+"</p><span>"+a+"</span>"+("todos"===this.currentTab?'<button class="ltc-empty-cta" data-ltc="invitar"><i class="fas fa-user-plus"></i> Invitá a tu círculo</button>':"")+"</div>")}const t=this.hiddenAuthors.length>0?this.events.filter(e=>!this.hiddenAuthors.includes(e.actor?.id)):this.events;if(this._renderFeedZones(t,e),this.deepLinkEventId){const e=this.deepLinkEventId;this.deepLinkEventId=null,setTimeout(()=>{this.openPostDetail(e)},500)}},_consumePendingShare(){this._pendingShare&&setTimeout(()=>{const e=document.getElementById("hdc2Ta");if(e){try{"function"==typeof window.openComposer?window.openComposer():document.getElementById("hdcComposeIn")?.click()}catch(t){}e.value=this._pendingShare,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),e.scrollIntoView({behavior:"smooth",block:"center"})}this._pendingShare=null},500)},renderEventCard(e){const t=this.eventTypes[e.event_type]||this.defaultConfig,a=e.metadata||{},s=!0===a.is_anonymous,i=s?{name:"Anonimo",initials:"??",avatar_url:null,id:null}:e.actor||{},o="system_predictor"===i.id||!i.id&&("prediction_shared"===e.event_type||"prediction_hit"===e.event_type),n="system_mia"===i.id||!i.id&&("mia_tip"===e.event_type||"mia_poll"===e.event_type),r=o||n,l=o?"/predictor-profile.html":n?"/mia.html":null,c=e.engagement||{},d=i.avatar_url?"has-image":"initials",p=o?"prediction_hit"===e.event_type?"🎉":"🎱":n?"🤖":null,m=i.avatar_url?'<img src="'+this.escapeHtml(i.avatar_url)+'" alt="'+this.escapeHtml(i.name)+'" class="avatar-fallback-img">':p?'<span style="font-size:1.3rem">'+p+"</span>":'<span style="color: '+(s?"#8b5cf6":t.color)+'">'+this.escapeHtml(i.initials||"??")+"</span>",u=s?"":i.verified?'<i class="fas fa-check-circle verified-badge"></i>':"",h=c.likes||"",g=c.comments||"",v=c.reposts||"",f=(c.views,"trending"===this.currentTab&&c.score>5?'<span class="trending-badge"><i class="fas fa-fire"></i></span>':""),b=this.renderImageGrid(e.image_url),w=s?' <i class="fas fa-user-secret" style="color: #8b5cf6; font-size: 0.75rem;" title="Publicación anonima"></i>':"",y=a.location?'<span class="post-location-badge"><i class="fas fa-map-marker-alt"></i> '+this.escapeHtml(a.location)+"</span>":"",E=s?a.real_actor_id||null:i.id,L=("user_post"===e.event_type&&E&&this.currentUserId&&String(E)===String(this.currentUserId))||window.__isAdminUser,I=L?'<div class="post-menu-container"><button class="post-menu-btn" title="Opciones"><i class="fas fa-ellipsis-h"></i></button><div class="post-menu-dropdown"><button class="post-menu-edit" data-id="'+this.escapeHtml(String(e.id))+'"><i class="fas fa-edit"></i> Editar</button><button class="post-menu-delete" data-id="'+this.escapeHtml(String(e.id))+'"><i class="fas fa-trash-alt"></i> Eliminar</button></div></div>':"",k=s?"#8b5cf620":t.color+"20",S=e.reposted_by?'<div class="sf-repost-banner" data-user-id="'+this.escapeHtml(String(e.reposted_by.id))+'"><i class="fas fa-retweet"></i> <span>'+'<span translate="no">' + this.escapeHtml(e.reposted_by.name) + '</span>'+" reposteo</span>"+(e.repost_quote?'<p class="sf-repost-quote">'+this.escapeHtml(e.repost_quote)+"</p>":"")+"</div>":"";return'<div class="social-card'+(s?" anonymous-post":"")+'" data-event-id="'+this.escapeHtml(String(e.id))+'" data-type="'+this.escapeHtml(e.event_type||"")+'" data-family="'+this._hitoFamily(e.event_type)+'">'+S+'<div class="social-card-header"><div class="actor-avatar '+d+'" style="background: '+k+'"'+(r?' data-href="'+l+'" role="button" tabindex="0" style="cursor:pointer"':s?"":' data-user-id="'+this.escapeHtml(String(i.id||""))+'" role="button" tabindex="0"')+">"+m+u+'</div><div class="actor-info"><span class="actor-name"'+(r?' data-href="'+l+'" role="button" tabindex="0" style="cursor:pointer;color:'+(o?"#ec4899":"#3b82f6")+'"':s?"":' data-user-id="'+this.escapeHtml(String(i.id||""))+'" role="button" tabindex="0"')+">"+'<span translate="no">' + this.escapeHtml(i.name||"Usuario") + '</span>'+w+" "+f+'</span>'+this._confianzaChip(i,s)+'<span class="event-type-label" style="color: '+t.color+'"><i class="fas '+t.icon+'"></i> '+t.label+y+'</span></div><span class="event-time">'+this.escapeHtml(e.time_ago||"")+"</span>"+I+'</div>'+this.renderSystemBanner(e)+'<div class="social-card-body">'+("user_post"===e.event_type?"":'<p class="event-title" style="white-space:pre-wrap;overflow-wrap:break-word">'+this.parseContent(e.title)+"</p>")+(e.description?'<p class="event-desc" style="white-space:pre-wrap;overflow-wrap:break-word">'+this.parseContent(e.description)+"</p>":"")+b+this.renderPollDisplay(e)+this.renderMetadata(e)+this.renderLinkPreviewCard(e)+'</div><div class="social-card-footer"><div class="sf-like-wrap"><button class="engagement-btn like-btn'+(e.is_liked?" liked":"")+'" data-id="'+this.escapeHtml(String(e.id))+'" title="Me gusta / Reaccionar"><i class="'+(e.is_liked?"fas":"far")+' fa-heart"></i><span>'+h+'</span></button></div><button class="engagement-btn comment-btn" data-id="'+this.escapeHtml(String(e.id))+'" title=t("buttons.comment", {defaultValue:"Comentar"})><i class="far fa-comment"></i><span>'+g+'</span></button><button class="engagement-btn share-btn" data-id="'+this.escapeHtml(String(e.id))+'" title="Compartir"><i class="fas fa-share-alt"></i></button><button class="engagement-btn repost-btn'+(e.is_reposted?" reposted":"")+'" data-id="'+this.escapeHtml(String(e.id))+'" title="Repostear"><i class="fas fa-retweet"></i><span>'+v+'</span></button><button class="engagement-btn bookmark-btn'+(e.is_bookmarked?" bookmarked":"")+'" data-id="'+this.escapeHtml(String(e.id))+'" title="Guardar"><i class="'+(e.is_bookmarked?"fas":"far")+' fa-bookmark"></i></button><button class="engagement-btn sf-more-btn" data-event-id="'+this.escapeHtml(String(e.id))+'" data-author-id="'+this.escapeHtml(String(i.id||""))+'" data-author-name="'+this.escapeHtml(String(i.name||""))+'" data-is-own="'+(L?"1":"")+'" title="Mas opciones"><i class="fas fa-ellipsis-h"></i></button></div>'+this._renderContextCTA(e)+this.renderReactionPills(e)+this.renderReachBar(e,i)+"</div>"},renderReactionPills(e){const t=(e.metadata||{}).reactions||{},a=this.reactionEmojis||{};let s="";for(const[i,o]of Object.entries(t))if(o&&o.length>0){s+='<span class="sf-reaction-pill'+(this.currentUserId&&o.includes(this.currentUserId)?" sf-reaction-mine":"")+'" data-reaction="'+i+'" data-event-id="'+this.escapeHtml(String(e.id))+'">'+(a[i]||i)+" "+o.length+"</span>"}return s?'<div class="sf-reactions-bar">'+s+"</div>":""},renderReachBar(e,t){var a=(e.engagement||{}).views||0;if(a<=0)return"";var s=this.currentUserId&&t.id&&String(t.id)===String(this.currentUserId),i=s?'<i class="fas fa-chart-line"></i> Tu post alcanzo <strong>'+a+"</strong> persona"+(1!==a?"s":"")+' &middot; <span class="sf-reach-link">Ver estadisticas</span>':'<i class="far fa-eye"></i> '+a+" vista"+(1!==a?"s":"")+' &middot; <span class="sf-reach-link">Ver</span>';return'<div class="sf-reach sf-reach-clickable" data-event-id="'+this.escapeHtml(String(e.id))+'" data-owner="'+(s?"1":"0")+'">'+i+"</div>"},renderSystemBanner(e){const t=e.metadata||{},a=e.event_type;if("distribution_completed"===a)return'<div class="sf-system-banner sf-banner-green"><i class="fas fa-gift"></i> '+'<span translate="no">' + this.escapeHtml(t.group_name||"Tanda") + '</span>'+" — Ciclo "+(t.cycle||"?")+" distribuido</div>";if("tanda_started"===a)return'<div class="sf-system-banner sf-banner-blue"><i class="fas fa-rocket"></i> '+(t.members||"?")+" participantes — L. "+(t.contribution||"?").toLocaleString()+"/ciclo</div>";if("weekly_digest"===a)return'<div class="sf-system-banner sf-banner-purple"><i class="fas fa-newspaper"></i> Publicado automaticamente cada lunes</div>';if("mia_tip"===a){var s=t.category_label||"Tip";return'<div class="sf-system-banner sf-banner-blue"><i class="fas fa-robot"></i> <span translate="no">MIA</span> — '+this.escapeHtml(s)+" · Tip diario</div>"}if("mia_poll"===a)return'<div class="sf-system-banner sf-banner-pink"><i class="fas fa-poll"></i> Encuesta semanal — vota!</div>';if("member_joined"===a)return'<div class="sf-system-banner sf-banner-green"><i class="fas fa-user-plus"></i> La comunidad crece</div>';if("group_full"===a)return'<div class="sf-system-banner sf-banner-amber"><i class="fas fa-users"></i> Grupo al completo</div>';if("perfect_cycle"===a)return'<div class="sf-system-banner sf-banner-gold"><i class="fas fa-star"></i> Todos pagaron a tiempo</div>';if("prediction_hit"===a){return'<div class="sf-system-banner celebration"><i class="fas fa-trophy"></i> '+({exact:"Acierto Exacto",jalador:"Jalador Acertado",hot:"Numero Caliente",near:"Casi Acierto"}[t.hit_type||"hit"]||"Acierto")+" — Predictor La Tanda v4.0</div>"}return""},async handleReaction(e,t){if(this.currentUserId)try{const i=localStorage.getItem("auth_token")||localStorage.getItem("authToken"),o=await fetch("/api/feed/social/"+e+"/react",{method:"POST",headers:{Authorization:"Bearer "+i,"Content-Type":"application/json"},body:JSON.stringify({reaction:t})}),n=await o.json();if(n.success){const i=this.events.find(t=>t.id===e);if(i){i.metadata||(i.metadata={}),i.metadata.reactions||(i.metadata.reactions={});const e=i.metadata.reactions[t]||[],a=e.indexOf(this.currentUserId);n.data.added?a<0&&e.push(this.currentUserId):a>=0&&e.splice(a,1),i.metadata.reactions[t]=e}const o=document.querySelector('[data-event-id="'+e+'"]');if(o&&i){const e=o.querySelector(".sf-reactions-bar");var a=this.renderReactionPills(i);if(e)a?e.outerHTML=a:e.remove();else if(a){var s=o.querySelector(".social-card-footer");s&&s.insertAdjacentHTML("afterend",a)}}}}catch(e){}},showReactionPicker(e,t){document.querySelectorAll(".sf-reaction-picker").forEach(e=>e.remove());const a=document.createElement("div");a.className="sf-reaction-picker";const s=this.reactionEmojis||{};for(const[t,i]of Object.entries(s)){const s=document.createElement("span");s.textContent=i,s.title=t,s.dataset.reaction=t,s.dataset.eventId=e,a.appendChild(s)}t.appendChild(a),setTimeout(()=>a.classList.add("sf-picker-show"),10);const i=e=>{a.contains(e.target)||t.contains(e.target)||(a.remove(),document.removeEventListener("click",i))};setTimeout(()=>document.addEventListener("click",i),50)},showInsightsModal(e,t){var a=this.events.find(function(t){return t.id===e});if(a){var s=a.engagement||{},i=a.metadata||{},o=s.views||0,n=s.likes||0,r=s.comments||0,l=s.reposts||0,c=s.shares||0,d=i.reactions||{},p=this.reactionEmojis||{},m=0,u="";for(var h in d)d[h]&&d[h].length>0&&(m+=d[h].length,u+='<span class="si-reaction">'+(p[h]||h)+" "+d[h].length+"</span>");var g=n+r+l+m,v=o>0?Math.round(g/o*1e3)/10:0,f=Math.min(100,o>0?Math.round(v):0);document.querySelectorAll(".si-overlay").forEach(function(e){e.remove()});var b=document.createElement("div");b.className="si-overlay";var w='<div class="si-modal"><div class="si-header"><span class="si-title"><i class="fas fa-chart-bar"></i> Estadisticas</span><button class="si-close">&times;</button></div><div class="si-body">';w+='<div class="si-stats"><div class="si-stat"><div class="si-stat-val">'+o+'</div><div class="si-stat-lbl"><i class="far fa-eye"></i> Vistas</div></div><div class="si-stat"><div class="si-stat-val">'+n+'</div><div class="si-stat-lbl"><i class="far fa-heart"></i> Likes</div></div><div class="si-stat"><div class="si-stat-val">'+r+'</div><div class="si-stat-lbl"><i class="far fa-comment"></i> Comentarios</div></div>',t&&(w+='<div class="si-stat"><div class="si-stat-val">'+l+'</div><div class="si-stat-lbl"><i class="fas fa-retweet"></i> Reposts</div></div><div class="si-stat"><div class="si-stat-val">'+m+'</div><div class="si-stat-lbl"><i class="fas fa-fire"></i> Reacciones</div></div><div class="si-stat"><div class="si-stat-val">'+c+'</div><div class="si-stat-lbl"><i class="fas fa-share-alt"></i> Compartidos</div></div>'),w+="</div>",t&&(w+='<div class="si-section"><div class="si-section-title">Alcance</div><div class="si-bar-wrap"><div class="si-bar-fill" style="width:'+Math.min(100,Math.max(5,o>0?40+Math.min(60,o):5))+'%"></div></div><div class="si-bar-label">'+o+" persona"+(1!==o?"s":"")+" alcanzadas</div></div>",w+='<div class="si-section"><div class="si-section-title">Tasa de Engagement</div><div class="si-bar-wrap"><div class="si-bar-fill si-bar-engagement" style="width:'+Math.min(100,Math.max(3,f))+'%"></div></div><div class="si-bar-label">'+v+'% <span class="si-bar-sub">(interacciones / vistas)</span></div></div>',u&&(w+='<div class="si-section"><div class="si-section-title">Reacciones</div><div class="si-reactions">'+u+"</div></div>"),w+='<div class="si-footer-note"><i class="fas fa-lock"></i> Solo tu ves las estadisticas completas</div>'),w+="</div></div>",b.innerHTML=w,document.body.appendChild(b),setTimeout(function(){b.classList.add("si-show")},10);var y=function(){b.classList.remove("si-show"),setTimeout(function(){b.remove()},200)};b.querySelector(".si-close").addEventListener("click",y),b.addEventListener("click",function(e){e.target===b&&y()})}},isVideoUrl(e){if(!e)return!1;const t=e.toLowerCase().split("?")[0];return[".mp4",".mov",".webm",".avi",".mkv"].some(e=>t.endsWith(e))},loadStories(){var self=this;var token=localStorage.getItem("auth_token")||localStorage.getItem("authToken");var h=token?{Authorization:"Bearer "+token}:{};fetch("/api/stories",{headers:h}).then(function(r){return r.json()}).then(function(d){if(d.success&&self._renderStoriesBar)self._renderStoriesBar(d.data||[])}).catch(function(e){console.error("Stories load error:",e)})},_renderStoriesBar(groups){var bar=document.getElementById("storiesBar");if(!bar)return;var scroll=bar.querySelector(".stories-scroll");if(!scroll)return;var me=null;try{var u=localStorage.getItem("latanda_user")||sessionStorage.getItem("latanda_user");if(u)me=JSON.parse(u)}catch(e){}var html="";var myAvatar=me?(me.avatar_url||me.profile_image_url||""):"";var myName=me?(me.name||me.full_name||"Tu"):"Tu";var myInitials=myName.split(" ").map(function(w){return w[0]}).join("").substring(0,2).toUpperCase();var ownGroup=groups.find(function(g){return g.is_own});if(ownGroup&&ownGroup.stories.length>0){html+='<div class="story-item own" data-user-index="0" data-user-id="own"><div class="story-avatar-ring'+(ownGroup.has_unseen?"":" seen")+'"><div class="story-avatar-inner">';html+=myAvatar?'<img src="'+this.escapeHtml(myAvatar)+'" alt="">':"<span class=\"story-initials\">"+this.escapeHtml(myInitials)+"</span>";html+='</div><div class="story-add-badge">+</div></div><span class="story-name">Tu historia</span></div>'}else{html+='<div class="story-item own" data-action="create-story"><div class="story-avatar-ring" style="background:rgba(255,255,255,0.1)"><div class="story-avatar-inner">';html+=myAvatar?'<img src="'+this.escapeHtml(myAvatar)+'" alt="">':"<span class=\"story-initials\">"+this.escapeHtml(myInitials)+"</span>";html+='</div><div class="story-add-badge">+</div></div><span class="story-name">Tu historia</span></div>'}scroll.innerHTML=html;scroll.querySelectorAll(".story-item").forEach(function(item){item.addEventListener("click",function(){if(item.dataset.action==="create-story")SocialFeed._openStoryCreator()})})},renderImageCarousel(e){if(!e)return"";let t=[];if(e.startsWith("["))try{t=JSON.parse(e)}catch(a){t=[e]}else t=[e];if(0===t.length)return"";if(1===t.length)return this.renderImageGrid(e);let s='<div class="pd-image-carousel"><div class="pd-carousel-track">';t.forEach(function(e,a){s+='<div class="pd-carousel-slide"><img src="'+SocialFeed.escapeHtml(e)+'" alt="" class="lightbox-trigger" data-lightbox-index="'+a+'"></div>'});s+='</div><span class="pd-carousel-counter">1 / '+t.length+'</span><div class="pd-carousel-dots">';t.forEach(function(e,a){s+='<button class="pd-carousel-dot'+(0===a?' active':'')+'" data-slide="'+a+'"></button>'});s+='</div></div>';return s},renderImageGrid(e){if(!e)return"";let t=[];if(e.startsWith("["))try{t=JSON.parse(e)}catch(a){t=[e]}else t=[e];if(0===t.length)return"";const a="event-media-grid grid-"+Math.min(t.length,4);let s=0;return'<div class="'+a+'">'+t.slice(0,4).map(e=>{if(this.isVideoUrl(e))return'<div class="media-video-wrapper"><video src="'+this.escapeHtml(e)+'" controls playsinline preload="auto"></video><div class="video-play-overlay"><i class="fas fa-play-circle"></i></div></div>';const t=e.includes("klipy")||e.includes("/gifs/")||e.toLowerCase().endsWith(".gif"),a=s++;return'<img src="'+this.escapeHtml(e)+'" alt="" loading="lazy" class="lightbox-trigger'+(t?" gif-media":"")+'" data-lightbox-index="'+a+'">'}).join("")+(t.length>1?'<span class="media-more-badge">+'+(t.length-1)+'</span>':"")+"</div>"},renderMetadata(e){const t=e.metadata||{},a=[];return t.price&&a.push('<span class="meta-price">L. '+Number(t.price).toLocaleString("es-HN")+"</span>"),t.location&&a.push('<span class="meta-location"><i class="fas fa-map-marker-alt"></i> '+this.escapeHtml(t.location)+"</span>"),t.members&&a.push('<span class="meta-members"><i class="fas fa-users"></i> '+this.escapeHtml(String(t.members))+" miembros</span>"),0===a.length?"":'<div class="event-meta">'+a.join("")+"</div>"},attachEngagementHandlers(){this._sfMoreBound||(this._sfMoreBound=!0,document.addEventListener("click",async e=>{const l=e.target.closest('.sf-more-popup [data-action^="sf-"]');if(l){const e=l.dataset.action,a=l.closest(".sf-more-popup");if("sf-hide-author"===e){const e=l.dataset.authorId;e&&!this.hiddenAuthors.includes(e)&&(this.hiddenAuthors.push(e),localStorage.setItem("sf_hidden_authors",JSON.stringify(this.hiddenAuthors)),this.renderEvents(),"function"==typeof showNotification&&showNotification(t("messages.hide_author",{defaultValue:"Veras menos publicaciones de este autor"}),"info"))}else if("sf-follow-author"===e){const e=l.dataset.authorId,a=localStorage.getItem("auth_token")||localStorage.getItem("authToken");a&&e&&fetch("/api/feed/social/follow/"+e,{method:"POST",headers:{Authorization:"Bearer "+a}}).then(e=>e.json()).then(e=>{e.success?"function"==typeof showNotification&&showNotification("Ahora sigues a "+(l.dataset.authorName||"este usuario"),"success"):"function"==typeof showNotification&&showNotification(e.message||"No se pudo seguir","info")}).catch(()=>{"function"==typeof showNotification&&showNotification(t("messages.connection_error",{defaultValue:"Error de conexion"}),"error")})}else if("sf-copy-link"===e){const e=l.dataset.eventId,a=window.location.origin+"/home-dashboard.html?event="+e;navigator.clipboard&&navigator.clipboard.writeText(a).then(()=>{"function"==typeof showNotification&&showNotification(t("messages.link_copied_short",{defaultValue:"Enlace copiado"}),"success")})}else if("sf-report-post"===e){const i=l.dataset.eventId;a&&a.remove(),this.reportPost(i);return};return void(a&&a.remove())}}));this.container&&this.container.addEventListener("click",async e=>{var a=e.target.closest(".sf-reach-clickable");if(a)return e.preventDefault(),void this.showInsightsModal(a.dataset.eventId,"1"===a.dataset.owner);var s=e.target.closest(".sf-reaction-pill");if(s)return void this.handleReaction(s.dataset.eventId,s.dataset.reaction);var i=e.target.closest(".sf-reaction-picker span");if(i){this.handleReaction(i.dataset.eventId,i.dataset.reaction);var o=i.closest(".sf-reaction-picker");return void(o&&o.remove())}const n=e.target.closest(".like-btn"),r=e.target.closest(".sf-more-btn");if(r){const t=r.dataset.authorId,a=r.dataset.authorName,s=r.dataset.eventId,i="1"===r.dataset.isOwn,o=document.querySelector(".sf-more-popup");o&&o.remove();const n=document.createElement("div");n.className="sf-more-popup";let l="";!i&&t&&this.currentUserId&&(l+='<button class="sf-more-option" data-action="sf-follow-author" data-author-id="'+this.escapeHtml(t)+'" data-author-name="@'+this.escapeHtml(a)+'"><i class="fas fa-user-plus"></i> Seguir a @'+this.escapeHtml(a)+"</button>"),l+='<button class="sf-more-option" data-action="sf-copy-link" data-event-id="'+this.escapeHtml(s)+'"><i class="fas fa-link"></i> Copiar enlace</button>',i||!t||"system_predictor"===t||t.startsWith("system_")||(l+='<button class="sf-more-option" data-action="sf-hide-author" data-author-id="'+this.escapeHtml(t)+'"><i class="fas fa-eye-slash"></i> No me interesa</button>'),i||!t||t.startsWith("system_")||(l+='<button class="sf-more-option sf-more-danger" data-action="sf-report-post" data-event-id="'+this.escapeHtml(s)+'"><i class="fas fa-flag"></i> Reportar</button>'),n.innerHTML=l,n.style.position="absolute";const c=r.getBoundingClientRect();return n.style.top=c.bottom+window.scrollY+4+"px",n.style.right=window.innerWidth-c.right+"px",document.body.appendChild(n),setTimeout(()=>{document.addEventListener("click",function e(){n.remove(),document.removeEventListener("click",e)})},10),void e.stopPropagation()}const c=e.target.closest(".bookmark-btn"),d=e.target.closest(".comment-btn"),p=e.target.closest(".share-btn"),m=e.target.closest(".repost-btn");if(n){e.preventDefault();var u=n.closest(".sf-like-wrap");if(u){var h=u.querySelector(".sf-reaction-picker");h?(h.remove(),await this.toggleLike(n)):this.showReactionPicker(n.dataset.id,u)}else await this.toggleLike(n)}c&&(e.preventDefault(),await this.toggleBookmark(c)),d&&(e.preventDefault(),this.openComments(d.dataset.id)),p&&(e.preventDefault(),this.shareEvent(p.dataset.id)),m&&(e.preventDefault(),this.handleRepost(m));const g=e.target.closest(".poll-vote-btn");if(g){e.preventDefault();const t=g.dataset.eventId,a=parseInt(g.dataset.option);return void this.handlePollVote(t,a)}const v=e.target.closest(".mention-link");if(v){e.preventDefault(),e.stopPropagation();const t=v.dataset.handle;return void(t&&this.showUserProfileByHandle(t,v))}const f=e.target.closest(".hashtag-link");if(f){e.preventDefault(),e.stopPropagation();const t=f.dataset.tag;return void(t&&this.filterByHashtag(t))}const b=e.target.closest(".actor-avatar[data-user-id]"),w=e.target.closest(".actor-name[data-user-id]");if(b||w){var y=(b||w).dataset.userId;if(y&&"null"!==y&&window.ProfileViewerModal)return e.preventDefault(),e.stopPropagation(),void window.ProfileViewerModal.open(y,"posts")}const E=e.target.closest(".social-card-body");if(E&&!e.target.closest("a")&&!e.target.closest("button")&&!e.target.closest(".poll-vote-btn")&&!e.target.closest("img.lightbox-trigger")&&!e.target.closest("video")){const t=E.closest(".social-card");if(t)return e.preventDefault(),void this.openPostDetail(t.dataset.eventId)}const L=e.target.closest("img.lightbox-trigger");if(L){e.preventDefault(),e.stopPropagation();const t=L.closest(".social-card"),a=t?t.dataset.eventId:null,s=a?this.events.find(e=>e.id===a):null;if(s&&s.image_url){let t=[];if(s.image_url.startsWith("["))try{t=JSON.parse(s.image_url)}catch(e){t=[s.image_url]}else t=[s.image_url];const a=parseInt(L.dataset.lightboxIndex)||0;t.length>0&&this.openLightbox(t,a)}return}})},async toggleLike(e){if(e.disabled)return;e.disabled=!0;const a=e.dataset.id,s=localStorage.getItem("auth_token")||localStorage.getItem("authToken");if(!s)return window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_to_like",{defaultValue:"Inicia sesion para dar like"})),void(e.disabled=!1);const i=e.classList.contains("liked");e.classList.toggle("liked");const o=e.querySelector("i");o.classList.toggle("far",i),o.classList.toggle("fas",!i);const n=e.querySelector("span"),r=parseInt(n.textContent)||0;n.textContent=i?Math.max(0,r-1)||"":r+1,i||e.animate([{transform:"scale(1)"},{transform:"scale(1.3)"},{transform:"scale(1)"}],{duration:200});try{(await fetch("/api/feed/social/"+a+"/like",{method:"POST",headers:{Authorization:"Bearer "+s}})).ok||(e.classList.toggle("liked"),o.classList.toggle("far"),o.classList.toggle("fas"),n.textContent=r||"")}catch(t){e.classList.toggle("liked"),o.classList.toggle("far"),o.classList.toggle("fas"),n.textContent=r||""}finally{e.disabled=!1}},async toggleBookmark(e){if(e.disabled)return;e.disabled=!0;const a=e.dataset.id,s=localStorage.getItem("auth_token")||localStorage.getItem("authToken");if(!s)return window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_to_save",{defaultValue:"Inicia sesion para guardar"})),void(e.disabled=!1);const i=e.classList.contains("bookmarked");e.classList.toggle("bookmarked");const o=e.querySelector("i");o.classList.toggle("far",i),o.classList.toggle("fas",!i),i||e.animate([{transform:"scale(1)"},{transform:"scale(1.2)"},{transform:"scale(1)"}],{duration:200});try{(await fetch("/api/feed/social/"+a+"/bookmark",{method:"POST",headers:{Authorization:"Bearer "+s}})).ok||(e.classList.toggle("bookmarked"),o.classList.toggle("far"),o.classList.toggle("fas"))}catch(t){e.classList.toggle("bookmarked"),o.classList.toggle("far"),o.classList.toggle("fas")}finally{e.disabled=!1}},async toggleRepost(e){if(e.disabled)return;e.disabled=!0;const a=e.dataset.id,s=localStorage.getItem("auth_token")||localStorage.getItem("authToken");if(!s)return window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.login_to_repost",{defaultValue:"Inicia sesion para repostear"})),void(e.disabled=!1);const i=e.classList.contains("reposted");e.classList.toggle("reposted");const o=e.querySelector("span"),n=parseInt(o.textContent)||0;o.textContent=i?Math.max(0,n-1)||"":n+1,i||e.animate([{transform:"scale(1)"},{transform:"scale(1.2) rotate(15deg)"},{transform:"scale(1) rotate(0deg)"}],{duration:250});try{const t=await fetch("/api/feed/social/"+a+"/repost",{method:"POST",headers:{Authorization:"Bearer "+s}});if(!t.ok){const a=await t.json().catch(function(){return{}});var r=a.data&&a.data.error&&a.data.error.message||"Error al repostear";window.LaTandaPopup&&window.LaTandaPopup.showError(r),e.classList.toggle("reposted"),o.textContent=n||""}}catch(t){e.classList.toggle("reposted"),o.textContent=n||""}finally{e.disabled=!1}},handleRepost(e){var t=e.dataset.id;e.classList.contains("reposted")?this.toggleRepost(e):this._showRepostMenu(e,t)},_showRepostMenu(e,t){var a=this,s=document.querySelector(".repost-menu-popup");s&&s.remove();var i=document.createElement("div");i.className="repost-menu-popup",i.innerHTML='<button class="repost-menu-item" data-action="simple"><i class="fas fa-retweet"></i> Repostear</button><button class="repost-menu-item" data-action="quote"><i class="fas fa-quote-left"></i> Citar</button>';var o=e.getBoundingClientRect();i.style.position="fixed",i.style.left=o.left+"px",i.style.bottom=window.innerHeight-o.top+4+"px",i.style.zIndex="9999",document.body.appendChild(i),i.addEventListener("click",function(s){var o=s.target.closest(".repost-menu-item");o&&(i.remove(),"simple"===o.dataset.action?a.toggleRepost(e):"quote"===o.dataset.action&&a._openQuoteRepostModal(e,t))});var n=function(t){i.contains(t.target)||t.target===e||(i.remove(),document.removeEventListener("click",n))};setTimeout(function(){document.addEventListener("click",n)},10)},_openQuoteRepostModal(e,a){var s=this.events.find(function(e){return String(e.id)===a}),i=s&&s.actor&&s.actor.name||"Usuario",o=s?this.escapeHtml(String(s.description||s.title||"").slice(0,120)):"",n=document.createElement("div");n.className="repost-quote-overlay",n.innerHTML='<div class="repost-quote-modal"><div class="repost-quote-header"><h3>Citar publicacion</h3><button class="repost-quote-close"><i class="fas fa-times"></i></button></div><div class="repost-quote-body"><textarea class="repost-quote-input" placeholder="Agrega tu comentario..." maxlength="500" rows="3"></textarea><div class="repost-quote-preview"><i class="fas fa-retweet" style="color:#22c55e;margin-right:6px;"></i><span class="repost-quote-author">'+this.escapeHtml(i)+"</span>"+(o?'<p class="repost-quote-text">'+o+"...</p>":"")+'</div></div><div class="repost-quote-footer"><button class="repost-quote-submit">Repostear con cita</button></div></div>',document.body.appendChild(n);var r=n.querySelector(".repost-quote-input"),l=n.querySelector(".repost-quote-submit");r.focus(),l.addEventListener("click",async function(){var s=r.value.trim();l.disabled=!0,l.textContent="Reposteando...";var i=localStorage.getItem("auth_token")||localStorage.getItem("authToken");try{var o=await fetch("/api/feed/social/"+a+"/repost",{method:"POST",headers:{Authorization:"Bearer "+i,"Content-Type":"application/json"},body:JSON.stringify({quote:s||null})});if(o.ok){e.classList.add("reposted");var c=e.querySelector("span"),d=parseInt(c.textContent)||0;c.textContent=d+1,e.animate([{transform:"scale(1)"},{transform:"scale(1.2) rotate(15deg)"},{transform:"scale(1) rotate(0deg)"}],{duration:250}),n.remove(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess(t("messages.reposted_with_quote",{defaultValue:"Reposteado con cita"}))}else{var p=await o.json().catch(function(){return{}}),m=p.data&&p.data.error&&p.data.error.message||"Error al repostear";window.LaTandaPopup&&window.LaTandaPopup.showError(m),l.disabled=!1,l.textContent="Repostear con cita"}}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.connection_error",{defaultValue:"Error de conexion"})),l.disabled=!1,l.textContent="Repostear con cita"}}),n.querySelector(".repost-quote-close").addEventListener("click",function(){n.remove()}),n.addEventListener("click",function(e){e.target===n&&n.remove()})},openComments(e){window.CommentsModal?window.CommentsModal.open(e):window.LaTandaPopup&&window.LaTandaPopup.showInfo("Comentarios proximamente")},shareEvent(e){const a=this.events.find(t=>String(t.id)===e);if(!a)return;const s=window.location.origin+"/home-dashboard.html?event="+e,i=a.title;navigator.share?navigator.share({title:"La Tanda",text:i,url:s}).catch(()=>{}):navigator.clipboard.writeText(s).then(()=>{window.LaTandaPopup&&window.LaTandaPopup.showSuccess(t("messages.link_copied",{defaultValue:"Link copiado al portapapeles"}))})},showLoadingIndicator(){const e=document.getElementById("socialFeedList");if(e&&this.events.length>0){e.querySelector(".social-feed-load-more")||e.insertAdjacentHTML("beforeend",'<div class="social-feed-load-more"><i class="fas fa-spinner fa-spin"></i></div>')}},hideLoadingIndicator(){const e=document.querySelector(".social-feed-load-more");e&&e.remove()},renderError(){const e=document.getElementById("socialFeedList");if(!e)return;e.innerHTML='<div class="social-feed-error"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar el feed</p><button class="btn-retry" data-action="retry-feed"><i class="fas fa-redo"></i> Reintentar</button></div>';const t=e.querySelector('[data-action="retry-feed"]');t&&t.addEventListener("click",()=>this.loadEvents(!0))},setupIntersectionObserver(){const e=document.getElementById("socialFeedSentinel");e&&(this.observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&this.hasMore&&!this.isLoading&&this.loadEvents()})},{root:null,rootMargin:"200px",threshold:0}),this.observer.observe(e))},setupAutoResize(){const e=document.getElementById("composeInput");if(!e)return;const t=()=>{e.style.height="auto",e.style.height=Math.min(e.scrollHeight,300)+"px"};e.addEventListener("input",t),e.addEventListener("focus",t),t()},setupLinkPreview(){const e=document.getElementById("composeInput");e&&(this._linkPreviewData=null,this._linkPreviewUrl=null,this._linkPreviewTimer=null,e.addEventListener("input",()=>{clearTimeout(this._linkPreviewTimer),this._linkPreviewTimer=setTimeout(()=>this.detectAndFetchLink(),800)}),e.addEventListener("paste",()=>{setTimeout(()=>this.detectAndFetchLink(),100)}))},detectAndFetchLink(){const e=document.getElementById("composeInput");if(!e)return;const t=e.value.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i);if(!t)return void this.clearLinkPreview();const a=t[0];a!==this._linkPreviewUrl&&(this._linkPreviewUrl=a,this.fetchLinkPreview(a))},async fetchLinkPreview(e){const t=document.getElementById("composeLinkPreview");if(t){t.style.display="block",t.innerHTML='<div class="link-preview-loading"><i class="fas fa-spinner fa-spin"></i> Cargando vista previa...</div>';try{const t=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"",a=await fetch("/api/link-preview?url="+encodeURIComponent(e),{headers:t?{Authorization:"Bearer "+t}:{}}),s=await a.json();s.success&&s.data&&this._linkPreviewUrl===e?(this._linkPreviewData=s.data,this.renderComposeLinkPreview(s.data)):this.clearLinkPreview()}catch(e){this.clearLinkPreview()}}},renderComposeLinkPreview(e){const t=document.getElementById("composeLinkPreview");if(!t)return;const a=e.image?'<div class="link-preview-image"><img src="'+this.escapeHtml(e.image)+'" alt="" loading="lazy"></div>':"",s=e.title||e.domain,i=e.description?'<p class="link-preview-desc">'+this.escapeHtml(e.description.length>120?e.description.substring(0,120)+"...":e.description)+"</p>":"";t.style.display="block",t.innerHTML='<div class="link-preview-card"><button class="link-preview-remove" title="Quitar"><i class="fas fa-times"></i></button>'+a+'<div class="link-preview-info"><span class="link-preview-domain"><i class="fas fa-link"></i> '+this.escapeHtml(e.domain)+'</span><span class="link-preview-title">'+this.escapeHtml(s)+"</span>"+i+"</div></div>",t.querySelector(".link-preview-remove").addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.clearLinkPreview()})},clearLinkPreview(){this._linkPreviewData=null,this._linkPreviewUrl=null;const e=document.getElementById("composeLinkPreview");e&&(e.style.display="none",e.innerHTML="")},getEmbedHtml(e){if(!e)return null;let t=e.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);return t?'<div class="embed-container"><iframe src="https://www.youtube.com/embed/'+t[1]+'?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>':(t=e.match(/vimeo\.com\/(?:video\/)?(\d+)/),t?'<div class="embed-container"><iframe src="https://player.vimeo.com/video/'+t[1]+'" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>':(t=e.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/),t?'<div class="embed-container embed-spotify"><iframe src="https://open.spotify.com/embed/'+t[1]+"/"+t[2]+'?theme=0" frameborder="0" allow="encrypted-media" allowfullscreen loading="lazy"></iframe></div>':(t=e.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/),t?'<div class="embed-container embed-tiktok"><iframe src="https://www.tiktok.com/embed/v2/'+t[1]+'" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowfullscreen loading="lazy"></iframe></div>':null)))},renderLinkPreviewCard(e){const t=(e.metadata||{}).link_preview;let a=t?t.url:null;if(!a&&e.description){const t=e.description.match(/https?:\/\/[^\s<>"]+/i);t&&(a=t[0])}if(!a)return"";const s=this.getEmbedHtml(a);if(s)return s;if(!t)return"";const i=t.image?'<div class="feed-link-preview-image"><img src="'+this.escapeHtml(t.image)+'" alt="" loading="lazy"></div>':"",o=t.title||t.domain||"",n=t.description?'<p class="feed-link-preview-desc">'+this.escapeHtml(t.description.length>150?t.description.substring(0,150)+"...":t.description)+"</p>":"";return'<a href="'+this.escapeHtml(t.url)+'" target="_blank" rel="noopener noreferrer" class="feed-link-preview-card">'+i+'<div class="feed-link-preview-info"><span class="feed-link-preview-domain"><i class="fas fa-link"></i> '+this.escapeHtml(t.domain||t.site_name||"")+'</span><span class="feed-link-preview-title">'+this.escapeHtml(o)+"</span>"+n+"</div></a>"},_mentionTa(){return document.getElementById("hdc2Ta")},setupMentionAutocomplete(){const e=this._mentionTa();if(!e||e.dataset.mentionBound)return;e.dataset.mentionBound="1";let t=document.getElementById("mentionAutocomplete");t||(t=document.createElement("div"),t.id="mentionAutocomplete",t.className="mention-autocomplete",t.style.display="none",document.body.appendChild(t)),this.mentionState={active:!1,startPos:0,query:"",selectedIndex:0,users:[]},e.addEventListener("input",e=>this.handleMentionInput(e)),e.addEventListener("keydown",e=>this.handleMentionKeydown(e)),e.addEventListener("blur",()=>{setTimeout(()=>this.hideMentionDropdown(),200)}),t.addEventListener("click",e=>{const t=e.target.closest(".mention-item");if(t){const e=t.dataset.handle;this.insertMention(e)}})},handleMentionInput(e){const t=e.target,a=t.value,s=t.selectionStart,i=a.substring(0,s).match(/@([\w\-\.]*)$/);i?(this.mentionState.active=!0,this.mentionState.startPos=s-i[0].length,this.mentionState.query=i[1],this.mentionState.selectedIndex=0,this.searchMentions(i[1])):this.hideMentionDropdown()},handleMentionKeydown(e){if(!this.mentionState.active)return;const t=document.getElementById("mentionAutocomplete").querySelectorAll(".mention-item");switch(e.key){case"ArrowDown":e.preventDefault(),this.mentionState.selectedIndex=Math.min(this.mentionState.selectedIndex+1,t.length-1),this.updateMentionSelection();break;case"ArrowUp":e.preventDefault(),this.mentionState.selectedIndex=Math.max(this.mentionState.selectedIndex-1,0),this.updateMentionSelection();break;case"Enter":case"Tab":if(t.length>0){e.preventDefault();const a=t[this.mentionState.selectedIndex];a&&this.insertMention(a.dataset.handle)}break;case"Escape":e.preventDefault(),e.stopPropagation(),this.hideMentionDropdown()}},async searchMentions(e){e.length<1?this.hideMentionDropdown():(clearTimeout(this.mentionDebounceTimer),this.mentionDebounceTimer=setTimeout(async()=>{try{const t=await fetch("/api/users/search-mentions?q="+encodeURIComponent(e)+"&limit=5",{headers:{"Authorization":"Bearer "+(localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"")}}),a=await t.json();a.success&&a.data.users.length>0?(this.mentionState.users=a.data.users,this.showMentionDropdown(a.data.users)):this.hideMentionDropdown()}catch(e){this.hideMentionDropdown()}},200))},showMentionDropdown(e){const t=document.getElementById("mentionAutocomplete");if(!t)return;t.innerHTML=e.map((e,t)=>{const a=e.avatar_url?'<img src="'+this.escapeHtml(e.avatar_url)+'" alt="" class="avatar-fallback-img">':'<span class="mention-initials">'+this.escapeHtml((e.name||"?").substring(0,2).toUpperCase())+"</span>",s=e.verified?'<i class="fas fa-check-circle verified-icon"></i>':"";return'<div class="mention-item '+(0===t?"selected":"")+'" data-handle="'+this.escapeHtml(e.handle)+'"><div class="mention-avatar">'+a+'</div><div class="mention-info"><span class="mention-name">'+'<span translate="no">' + this.escapeHtml(e.name) + '</span>'+s+'</span><span class="mention-handle">@'+'<span translate="no">' + this.escapeHtml(e.handle) + '</span>'+"</span></div></div>"}).join("");const o=this._mentionTa();if(o){const r=o.getBoundingClientRect(),b=r.bottom+4,sp=288;t.style.position="fixed",t.style.left=r.left+"px",t.style.width=r.width+"px",t.style.right="auto",t.style.zIndex="10050",b+sp>window.innerHeight&&r.top>sp?(t.style.top="auto",t.style.bottom=window.innerHeight-r.top+4+"px"):(t.style.bottom="auto",t.style.top=b+"px")}t.style.display="block"},hideMentionDropdown(){const e=document.getElementById("mentionAutocomplete");e&&(e.style.display="none"),this.mentionState.active=!1,this.mentionState.users=[]},updateMentionSelection(){document.getElementById("mentionAutocomplete").querySelectorAll(".mention-item").forEach((e,t)=>{e.classList.toggle("selected",t===this.mentionState.selectedIndex)})},insertMention(e){const t=this._mentionTa();if(!t)return;const a=t.value,s=a.substring(0,this.mentionState.startPos),i=a.substring(t.selectionStart);t.value=s+"@"+e+" "+i,t.focus();const o=this.mentionState.startPos+e.length+2;t.setSelectionRange(o,o),t.dispatchEvent(new Event("input",{bubbles:!0})),this.hideMentionDropdown()},decodeEntities(e){if(!e)return"";return String(e).replace(/&#x27;/g,String.fromCharCode(39)).replace(/&#39;/g,String.fromCharCode(39)).replace(/&quot;/g,String.fromCharCode(34)).replace(/&lt;/g,String.fromCharCode(60)).replace(/&gt;/g,String.fromCharCode(62)).replace(/&amp;/g,String.fromCharCode(38))},parseContent(e){if(!e)return"";let t=this.escapeHtml(this.decodeEntities(e));return t=t.replace(/(^|[^&\w])@([\w\-\.]+)/g,'$1<a href="#" class="mention-link" data-handle="$2">@$2</a>'),t=t.replace(/(^|[^&\w])#([\wáéíóúñÁÉÍÓÚÑ]+)/g,'$1<a href="#" class="hashtag-link" data-tag="$2">#$2</a>'),t=t.replace(/(https?:\/\/[^\s<>"]+)/gi,'<a href="$1" target="_blank" rel="noopener noreferrer" class="post-link">$1</a>'),t},async showUserProfileByHandle(e,a){try{const t=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"",s=await fetch("/api/users/by-handle/"+e,{headers:t?{Authorization:"Bearer "+t}:{}}),i=await s.json();i.success&&i.data&&i.data.user_id?window.UserMiniProfile&&window.UserMiniProfile.showPinned(a,String(i.data.user_id)):window.LaTandaPopup&&window.LaTandaPopup.showInfo("Usuario @"+e+" no encontrado")}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError(t("messages.user_search_error",{defaultValue:"Error al buscar usuario"}))}},filterByHashtag(e){const t=new URL(window.location);t.searchParams.set("hashtag",e),window.history.pushState({},"",t),this.currentHashtag=e,this.showHashtagFilter(e),this.loadEvents(!0)},showHashtagFilter(e){const t=this.container.querySelector(".social-feed-wrapper");if(!t)return;const a=t.querySelector(".hashtag-filter-bar");a&&a.remove();const s='<div class="hashtag-filter-bar"><span>Mostrando posts con <strong>#'+this.escapeHtml(e)+'</strong></span><button class="clear-filter-btn" title="Limpiar filtro"><i class="fas fa-times"></i></button></div>',i=t.querySelector(".feed-tabs-container");i?i.insertAdjacentHTML("afterend",s):t.insertAdjacentHTML("afterbegin",s);const o=t.querySelector(".clear-filter-btn");o&&o.addEventListener("click",()=>this.clearHashtagFilter())},clearHashtagFilter(){this.currentHashtag=null;const e=new URL(window.location);e.searchParams.delete("hashtag"),window.history.pushState({},"",e);const t=this.container.querySelector(".hashtag-filter-bar");t&&t.remove(),this.loadEvents(!0)},setupSearch(){const e=document.getElementById("sidebarSearch");if(!e)return;let t=null;e.addEventListener("keydown",a=>{if("Enter"===a.key){a.preventDefault(),clearTimeout(t);const s=e.value.trim();s.length>0?this.filterBySearch(s):this.clearSearch()}}),e.addEventListener("input",()=>{clearTimeout(t);const a=e.value.trim();0===a.length&&this.currentSearch?this.clearSearch():a.length>=2&&(t=setTimeout(()=>this.filterBySearch(a),500))})},filterBySearch(e){this.currentSearch=e,this.showSearchFilter(e),this.loadEvents(!0)},showSearchFilter(e){const t=this.container.querySelector(".social-feed-wrapper");if(!t)return;const a=t.querySelector(".search-filter-bar");a&&a.remove();const s='<div class="search-filter-bar"><span><i class="fas fa-search"></i> Resultados para <strong>'+this.escapeHtml(e)+'</strong></span><button class="clear-filter-btn" title="Limpiar busqueda"><i class="fas fa-times"></i></button></div>',i=t.querySelector(".feed-tabs-container");i?i.insertAdjacentHTML("afterend",s):t.insertAdjacentHTML("afterbegin",s);const o=t.querySelector(".search-filter-bar .clear-filter-btn");o&&o.addEventListener("click",()=>this.clearSearch())},clearSearch(){this.currentSearch=null;const e=document.getElementById("sidebarSearch");e&&(e.value="");const t=this.container.querySelector(".search-filter-bar");t&&t.remove(),this.loadEvents(!0)},escapeHtml(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")},isMobileDevice:()=>/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||navigator.maxTouchPoints>0&&window.innerWidth<1024,async openCameraModal(e){const t=document.getElementById("cameraModal"),a=document.getElementById("cameraPreview"),s=document.getElementById("cameraModalTitle"),i=document.getElementById("cameraCaptureBtn"),o=document.getElementById("cameraRecordBtn"),n=document.getElementById("cameraTimer");if(t&&a){this.cameraMode=e,this.cameraFacingMode="user",this.mediaRecorder=null,this.recordedChunks=[],this.recordingTimer=null,this.recordingSeconds=0,s.textContent="photo"===e?"Tomar foto":"Grabar video",i.style.display="photo"===e?"":"none",o.style.display="video"===e?"":"none",n.style.display="none",t.classList.add("show");try{await this.startCameraStream()}catch(e){return window.LaTandaPopup&&window.LaTandaPopup.showError("No se pudo acceder a la camara"),void this.closeCameraModal()}i.onclick=()=>this.capturePhoto(),o.onclick=()=>{this.mediaRecorder&&"recording"===this.mediaRecorder.state?this.stopRecording():this.startRecording()},document.getElementById("cameraSwitchBtn").onclick=async()=>{this.cameraFacingMode="user"===this.cameraFacingMode?"environment":"user",await this.startCameraStream()},document.getElementById("cameraModalClose").onclick=()=>this.closeCameraModal(),t.onclick=e=>{e.target===t&&this.closeCameraModal()}}},async startCameraStream(){const e=document.getElementById("cameraPreview");if(!e)return;this.cameraStream&&this.cameraStream.getTracks().forEach(e=>e.stop());const t=/Android|iPhone|iPad/i.test(navigator.userAgent),a={video:{facingMode:this.cameraFacingMode,width:{ideal:t?640:1280},height:{ideal:t?480:720}},audio:"video"===this.cameraMode};this.cameraStream=await navigator.mediaDevices.getUserMedia(a),e.srcObject=this.cameraStream},capturePhoto(){const e=document.getElementById("cameraPreview"),t=document.getElementById("cameraCanvas");e&&t&&(t.width=e.videoWidth,t.height=e.videoHeight,t.getContext("2d").drawImage(e,0,0),t.toBlob(e=>{if(!e)return;const t=new File([e],"camera-photo-"+Date.now()+".jpg",{type:"image/jpeg"});this.selectedImages.push({file:t,previewUrl:URL.createObjectURL(e),type:"image"}),this.renderImagePreviews(),this.updateImageButton(),this.closeCameraModal(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess("Foto capturada")},"image/jpeg",.9))},startRecording(){document.getElementById("cameraPreview");const e=document.getElementById("cameraRecordBtn"),t=document.getElementById("cameraTimer");if(!this.cameraStream)return;this.recordedChunks=[];const a=/Android|iPhone|iPad/i.test(navigator.userAgent),s=MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":MediaRecorder.isTypeSupported("video/webm")?"video/webm":"video/mp4";this.mediaRecorder=new MediaRecorder(this.cameraStream,{mimeType:s,videoBitsPerSecond:a?15e5:25e5}),this.mediaRecorder.ondataavailable=e=>{e.data.size>0&&this.recordedChunks.push(e.data)},this.mediaRecorder.onstop=()=>this.handleRecordingComplete(),this.mediaRecorder.start(1e3),e.classList.add("recording"),e.innerHTML='<i class="fas fa-stop"></i>',t.style.display="",this.recordingSeconds=0,t.textContent="00:00",this.recordingTimer=setInterval(()=>{this.recordingSeconds++;const e=String(Math.floor(this.recordingSeconds/60)).padStart(2,"0"),a=String(this.recordingSeconds%60).padStart(2,"0");t.textContent=e+":"+a,this.recordingSeconds>=(this.maxVideoDuration||60)&&this.stopRecording()},1e3)},stopRecording(){this.mediaRecorder&&"recording"===this.mediaRecorder.state&&this.mediaRecorder.stop(),this.recordingTimer&&(clearInterval(this.recordingTimer),this.recordingTimer=null);const e=document.getElementById("cameraRecordBtn");e&&(e.classList.remove("recording"),e.innerHTML='<i class="fas fa-circle"></i>')},handleRecordingComplete(){if(0===this.recordedChunks.length)return;const e=this.recordedChunks[0].type.includes("webm")?".webm":".mp4",t=new Blob(this.recordedChunks,{type:this.recordedChunks[0].type}),a=new File([t],"camera-video-"+Date.now()+e,{type:t.type});if(a.size>(this.maxVideoSize||52428800))return window.LaTandaPopup&&window.LaTandaPopup.showWarning("Video excede 50MB"),void this.closeCameraModal();this.selectedImages.push({file:a,previewUrl:URL.createObjectURL(t),type:"video"}),this.renderImagePreviews(),this.updateImageButton(),this.closeCameraModal(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess("Video grabado ("+this.recordingSeconds+"s)")},closeCameraModal(){const e=document.getElementById("cameraModal");e&&e.classList.remove("show"),this.cameraStream&&(this.cameraStream.getTracks().forEach(e=>e.stop()),this.cameraStream=null),this.recordingTimer&&(clearInterval(this.recordingTimer),this.recordingTimer=null),this.mediaRecorder&&"recording"===this.mediaRecorder.state&&this.mediaRecorder.stop(),this.mediaRecorder=null,this.recordedChunks=[]},setupVideoOverlays(){this.container&&(this.container.addEventListener("play",e=>{if("VIDEO"===e.target.tagName){const t=e.target.closest(".media-video-wrapper");if(t){const e=t.querySelector(".video-play-overlay");e&&(e.style.opacity="0")}this.container.querySelectorAll(".media-video-wrapper video").forEach(t=>{t===e.target||t.paused||t.pause()})}},!0),this.container.addEventListener("pause",e=>{if("VIDEO"===e.target.tagName){const t=e.target.closest(".media-video-wrapper");if(t){const e=t.querySelector(".video-play-overlay");e&&(e.style.opacity="1")}}},!0),this.videoVisibilityObserver=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting||"VIDEO"!==e.target.tagName||e.target.paused||e.target.pause()})},{threshold:.25}))},emojiCategories:{caritas:["😀","😁","😂","🤣","😊","😍","🥰","😘","😜","🤔","😴","😭","🥺","😤","😎","🤯","🥳","🫡","🫣","😅","😇","🤩","😋","😝","🤗","🤫","🤭","😏","😒","🙄","😬","😱","😈"],manos:["👍","👎","👏","🙌","🤝","✌️","🤞","👋","🫶","💪","🙏","🤙","👆","👇","👉","👈","🤟","🫰","🤌","👊","✊","🤜","🤛","🫳","🫴"],corazones:["❤️","🧡","💛","💚","💙","💜","🤍","🖤","💗","💕","💞","💓","💔","🫀","💘","💝","💖","🤎","❤️‍🔥","❤️‍🩹"],objetos:["🔥","⭐","💰","🎯","🎲","🏆","🎉","✅","❌","⚡","🚀","💡","🎵","📸","🛒","🎮","📱","💻","🎨","🏠","🚗","✈️","🍕","🍺","☕"],simbolos:["💯","🔔","📌","🏷️","💎","🌟","☀️","🌈","🍀","🎁","📊","🗓️","⏰","🔒","🔑","✨","💥","🎶","🏁","♻️","⚠️","🔗","📍"]},setupEmojiPicker(){const e=document.getElementById("composeEmojiBtn"),t=document.getElementById("composeEmojiPanel");e&&t&&(this.renderEmojiCategory("caritas"),e.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation();const a=document.getElementById("composeInput");a&&a.blur(),this.closeGifPanel(),this.closePollPanel(),t.style.display="none"===t.style.display?"block":"none"}),t.addEventListener("click",e=>{const a=e.target.closest(".emoji-tab");a&&(t.querySelectorAll(".emoji-tab").forEach(e=>e.classList.remove("active")),a.classList.add("active"),this.renderEmojiCategory(a.dataset.cat));const s=e.target.closest(".emoji-item");s&&this.insertEmojiAtCursor(s.textContent)}),document.addEventListener("click",e=>{e.target.closest(".compose-emoji-wrapper")||e.target.closest(".compose-emoji-panel")||(t.style.display="none")}))},renderEmojiCategory(e){const t=document.getElementById("emojiGrid");if(!t)return;const a=this.emojiCategories[e]||[];t.innerHTML=a.map(e=>'<span class="emoji-item">'+e+"</span>").join("")},insertEmojiAtCursor(e){const t=document.getElementById("composeInput");if(!t)return;const a=t.selectionStart,s=t.selectionEnd,i=t.value;t.value=i.substring(0,a)+e+i.substring(s),t.focus();const o=a+e.length;t.setSelectionRange(o,o),t.dispatchEvent(new Event("input"))},pollActive:!1,setupPollCreator(){const e=document.getElementById("composePollBtn"),t=document.getElementById("composePollPanel"),a=document.getElementById("pollPanelClose"),s=document.getElementById("pollAddOption");e&&t&&(e.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation();const s=document.getElementById("composeInput");s&&s.blur(),this.closeEmojiPanel(),this.closeGifPanel(),this.pollActive?this.closePollPanel():(t.style.display="block",this.pollActive=!0,e.classList.add("active"),this.clearAllImages())}),a&&a.addEventListener("click",()=>this.closePollPanel()),s&&s.addEventListener("click",()=>{const e=document.getElementById("pollOptionsList"),t=e.querySelectorAll(".poll-option-input");if(t.length>=4)return void(window.LaTandaPopup&&window.LaTandaPopup.showWarning("Maximo 4 opciones"));const a=document.createElement("input");a.className="poll-option-input",a.type="text",a.placeholder="Opcion "+(t.length+1),a.maxLength=80,e.appendChild(a),a.focus(),t.length+1>=4&&(s.style.display="none")}))},closePollPanel(){const e=document.getElementById("composePollPanel"),t=document.getElementById("composePollBtn");e&&(e.style.display="none"),t&&t.classList.remove("active"),this.pollActive=!1},getPollData(){if(!this.pollActive)return null;const e=document.getElementById("pollOptionsList"),t=document.getElementById("pollDuration");if(!e)return null;const a=e.querySelectorAll(".poll-option-input"),s=[];return a.forEach(e=>{const t=e.value.trim();t&&s.push(t)}),s.length<2?null:{options:s,duration_hours:parseInt(t?t.value:"72")}},closeEmojiPanel(){const e=document.getElementById("composeEmojiPanel");e&&(e.style.display="none")},gifSearchTimeout:null,selectedGif:null,setupGifSelector(){const e=document.getElementById("composeGifBtn"),t=document.getElementById("composeGifPanel"),a=document.getElementById("gifSearchInput");if(!e||!t)return;e.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),this.closeEmojiPanel(),this.closePollPanel(),"block"===t.style.display)this.closeGifPanel();else{const e=document.getElementById("composeInput");e&&e.blur(),t.style.display="block",this.loadTrendingGifs(),a&&!this.isMobileDevice()&&a.focus()}}),a&&a.addEventListener("input",e=>{clearTimeout(this.gifSearchTimeout);const t=e.target.value.trim();this.gifSearchTimeout=setTimeout(()=>{t.length>1?this.searchGifs(t):this.loadTrendingGifs()},400)}),document.addEventListener("click",e=>{e.target.closest(".compose-gif-wrapper")||e.target.closest(".compose-gif-panel")||this.closeGifPanel()});const s=document.getElementById("gifGrid");s&&s.addEventListener("click",e=>{const t=e.target.closest(".gif-item img");t&&this.selectGif(t.dataset.full)})},closeGifPanel(){const e=document.getElementById("composeGifPanel");e&&(e.style.display="none")},async loadTrendingGifs(){const e=document.getElementById("gifGrid");if(e){e.innerHTML='<div class="gif-loading"><i class="fas fa-spinner fa-spin"></i></div>';try{const t=await fetch("/api/gifs/trending"),a=await t.json();a.success&&a.data?this.renderGifGrid(a.data):e.innerHTML='<div class="gif-empty">No se pudieron cargar GIFs</div>'}catch(t){e.innerHTML='<div class="gif-empty">Error al cargar GIFs</div>'}}},async searchGifs(e){const t=document.getElementById("gifGrid");if(t){t.innerHTML='<div class="gif-loading"><i class="fas fa-spinner fa-spin"></i></div>';try{const a=await fetch("/api/gifs/search?q="+encodeURIComponent(e)),s=await a.json();s.success&&s.data&&s.data.length>0?this.renderGifGrid(s.data):t.innerHTML='<div class="gif-empty">No se encontraron GIFs</div>'}catch(e){t.innerHTML='<div class="gif-empty">Error al buscar GIFs</div>'}}},renderGifGrid(e){const t=document.getElementById("gifGrid");t&&(t.innerHTML=e.map(e=>'<div class="gif-item"><img src="'+this.escapeHtml(e.preview||e.url)+'" data-full="'+this.escapeHtml(e.url)+'" alt="GIF" loading="lazy"></div>').join(""))},selectGif(e){if(!e)return;this.selectedGif=e,this.clearAllImages(),this.closePollPanel(),this.closeGifPanel();const t=document.getElementById("composeImagesPreview");t&&(t.style.display="grid",t.className="compose-images-preview preview-1",t.innerHTML='<div class="preview-item"><img src="'+this.escapeHtml(e)+'" alt="GIF"><button class="remove-image" data-index="gif" title="Eliminar"><i class="fas fa-times"></i></button><span class="gif-badge">GIF</span></div>',t.querySelector(".remove-image").addEventListener("click",()=>{this.selectedGif=null,t.style.display="none",t.innerHTML=""})),window.LaTandaPopup&&window.LaTandaPopup.showSuccess("GIF seleccionado")},renderPollDisplay(e){const t=e.metadata||{};if(!t.poll)return"";const a=t.poll,s=a.options||[],i=a.votes||s.map(()=>0),o=a.total_votes||i.reduce((e,t)=>e+t,0),n=a.expires_at?new Date(a.expires_at):null,r=n&&n<new Date,l=void 0!==a.user_vote?a.user_vote:null,c=null!==l||r;let d="";if(r)d="Finalizada";else if(n){const e=n-new Date,t=Math.floor(e/864e5),a=Math.floor(e/36e5);d=t>0?"Quedan "+t+" dia"+(t>1?"s":""):a>0?"Quedan "+a+" hora"+(a>1?"s":""):"Menos de 1 hora"}let p="";return p=c?s.map((e,t)=>{const a=i[t]||0,s=o>0?Math.round(a/o*100):0;return'<div class="poll-result-bar '+(a===Math.max(...i)&&o>0?"winner":"")+'"><div class="poll-bar-fill" style="width:'+s+'%"></div><span class="poll-option-text">'+(l===t?'<i class="fas fa-check-circle"></i> ':"")+this.escapeHtml(e)+'</span><span class="poll-option-pct">'+s+"%</span></div>"}).join(""):s.map((t,a)=>'<button class="poll-vote-btn" data-event-id="'+this.escapeHtml(String(e.id))+'" data-option="'+a+'">'+this.escapeHtml(t)+"</button>").join(""),'<div class="poll-display" data-event-id="'+e.id+'">'+p+'<div class="poll-info">'+o+" voto"+(1!==o?"s":"")+(d?" · "+d:"")+"</div></div>"},async handlePollVote(e,t){const a=localStorage.getItem("auth_token")||localStorage.getItem("authToken");if(a)try{const s=await fetch("/api/feed/social/"+e+"/vote",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+a},body:JSON.stringify({option_index:t})}),i=await s.json();if(i.success){const o=this.events.find(x=>String(x.id)===e),p=i.data&&i.data.poll;if(o&&o.metadata&&o.metadata.poll){const q=o.metadata.poll;if(p&&null!=p.user_vote)o.metadata.poll=p;else{q.votes=Array.isArray(q.votes)?q.votes.slice():(q.options||[]).map(()=>0);if(null==q.votes[t])q.votes[t]=0;q.votes[t]+=1,q.total_votes=q.votes.reduce((x,y)=>x+(y||0),0),q.user_vote=t}}this.renderEvents(),window.LaTandaPopup&&window.LaTandaPopup.showSuccess("Voto registrado")}else window.LaTandaPopup&&window.LaTandaPopup.showWarning(i.data&&i.data.error&&i.data.error.message||i.message||"Error al votar")}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showError("Error al votar")}else window.LaTandaPopup&&window.LaTandaPopup.showError("Inicia sesion para votar")},selectedLocation:null,setupLocation(){const e=document.getElementById("composeLocationBtn"),t=document.getElementById("composeLocationPanel"),a=document.getElementById("locationPanelClose"),s=document.getElementById("locationDetectBtn"),i=document.getElementById("locationInput");e&&t&&(e.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation();const s=document.getElementById("composeInput");s&&s.blur(),this.closeEmojiPanel(),this.closeGifPanel(),this.closePollPanel(),"block"===t.style.display?this.closeLocationPanel():(t.style.display="block",e.classList.add("active"),i&&!this.isMobileDevice()&&i.focus())}),a&&a.addEventListener("click",()=>this.closeLocationPanel()),i&&i.addEventListener("change",()=>{const t=i.value.trim();this.selectedLocation=t||null,t?e.classList.add("active"):e.classList.remove("active")}),s&&s.addEventListener("click",()=>this.detectLocation()))},closeLocationPanel(){const e=document.getElementById("composeLocationPanel"),t=document.getElementById("composeLocationBtn");e&&(e.style.display="none"),!this.selectedLocation&&t&&t.classList.remove("active")},async detectLocation(){const e=document.getElementById("locationDetectBtn"),t=document.getElementById("locationInput");navigator.geolocation?(e&&(e.disabled=!0,e.innerHTML='<i class="fas fa-spinner fa-spin"></i> Detectando...'),navigator.geolocation.getCurrentPosition(async a=>{try{const e=a.coords.latitude,s=a.coords.longitude,i=await fetch("https://nominatim.openstreetmap.org/reverse?lat="+e+"&lon="+s+"&format=json&accept-language=es"),o=await i.json(),n=o.address?.city||o.address?.town||o.address?.village||o.address?.state||"",r=o.address?.country||"",l=n?n+(r?", "+r:""):(o.display_name||"").split(",").slice(0,2).join(",");if(t&&l){t.value=l,this.selectedLocation=l;const e=document.getElementById("composeLocationBtn");e&&e.classList.add("active")}}catch(e){window.LaTandaPopup&&window.LaTandaPopup.showWarning("No se pudo detectar la ubicacion")}e&&(e.disabled=!1,e.innerHTML='<i class="fas fa-crosshairs"></i> Detectar')},t=>{window.LaTandaPopup&&window.LaTandaPopup.showWarning("Permiso de ubicacion denegado"),e&&(e.disabled=!1,e.innerHTML='<i class="fas fa-crosshairs"></i> Detectar')},{enableHighAccuracy:!1,timeout:1e4})):window.LaTandaPopup&&window.LaTandaPopup.showWarning("Tu navegador no soporta geolocalizacion")},lightboxUrls:[],lightboxIndex:0,setupLightbox(){const e=document.getElementById("mediaLightbox"),t=document.getElementById("lightboxClose"),a=document.getElementById("lightboxPrev"),s=document.getElementById("lightboxNext"),i=e?e.querySelector(".lightbox-backdrop"):null;if(!e)return;t&&t.addEventListener("click",()=>this.closeLightbox()),i&&i.addEventListener("click",()=>this.closeLightbox()),a&&a.addEventListener("click",e=>{e.stopPropagation(),this.lightboxNav(-1)}),s&&s.addEventListener("click",e=>{e.stopPropagation(),this.lightboxNav(1)}),document.addEventListener("keydown",t=>{e.classList.contains("active")&&("Escape"===t.key&&this.closeLightbox(),"ArrowLeft"===t.key&&this.lightboxNav(-1),"ArrowRight"===t.key&&this.lightboxNav(1))});let o=0,n=0;const r=document.getElementById("lightboxContent");r&&(r.addEventListener("touchstart",e=>{o=e.touches[0].clientX,n=e.touches[0].clientY},{passive:!0}),r.addEventListener("touchend",e=>{const t=e.changedTouches[0].clientX-o,a=e.changedTouches[0].clientY-n;Math.abs(t)>50&&Math.abs(t)>Math.abs(a)&&(t>0?this.lightboxNav(-1):this.lightboxNav(1)),a>100&&Math.abs(a)>Math.abs(t)&&this.closeLightbox()},{passive:!0}))},openLightbox(e,t){this.lightboxUrls=e,this.lightboxIndex=t||0;const a=document.getElementById("mediaLightbox");a&&(this.updateLightboxImage(),a.classList.add("active"),document.body.style.overflow="hidden")},closeLightbox(){const e=document.getElementById("mediaLightbox");if(!e)return;e.classList.remove("active"),document.body.style.overflow="";const t=document.getElementById("lightboxImg");t&&(t.src="");const a=document.getElementById("lightboxVideo");a&&(a.pause(),a.src="",a.style.display="none")},lightboxNav(e){this.lightboxUrls.length<=1||(this.lightboxIndex=(this.lightboxIndex+e+this.lightboxUrls.length)%this.lightboxUrls.length,this.updateLightboxImage())},updateLightboxImage(){const e=document.getElementById("lightboxImg"),t=document.getElementById("lightboxVideo"),a=document.getElementById("lightboxCounter"),s=document.getElementById("lightboxPrev"),i=document.getElementById("lightboxNext"),o=this.lightboxUrls[this.lightboxIndex];this.isVideoUrl(o)?(e&&(e.style.display="none",e.src=""),t&&(t.pause(),t.style.display="block",t.src=o,t.load())):(t&&(t.pause(),t.src="",t.style.display="none"),e&&(e.style.display="block",e.classList.remove("loaded"),e.src=o,e.onload=()=>e.classList.add("loaded")));const n=this.lightboxUrls.length;a&&(a.textContent=n>1?this.lightboxIndex+1+" / "+n:""),s&&(s.style.display=n>1?"":"none"),i&&(i.style.display=n>1?"":"none")},incognitoMode:!1,setupIncognito(){const e=document.getElementById("composeIncognitoBtn"),t=document.getElementById("composeIncognitoBar"),a=document.getElementById("incognitoBarClose");e&&(e.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation();const s=document.getElementById("composeInput");s&&s.blur(),this.incognitoMode=!this.incognitoMode,this.incognitoMode?(e.classList.add("active"),t&&(t.style.display="flex")):(e.classList.remove("active"),t&&(t.style.display="none"))}),a&&a.addEventListener("click",()=>{this.incognitoMode=!1,e.classList.remove("active"),t&&(t.style.display="none")}))},openCompose(){try{this._ltcOpenLogro();}catch(e){}},setupViewTracking(){const e="sf_viewed";let t;try{const a=sessionStorage.getItem(e);t=a?new Set(JSON.parse(a)):new Set}catch(e){t=new Set}this.viewObserver=new IntersectionObserver(a=>{a.forEach(a=>{const s=a.target.dataset.eventId;if(s)if(a.isIntersecting){if(t.has(s))return;this.viewTimers[s]=setTimeout(()=>{t.add(s),this.pendingViews.add(s);try{sessionStorage.setItem(e,JSON.stringify([...t]))}catch(e){}delete this.viewTimers[s]},2e3)}else this.viewTimers[s]&&(clearTimeout(this.viewTimers[s]),delete this.viewTimers[s])})},{threshold:.5}),this.viewFlushInterval=setInterval(()=>this.flushViewTracker(),3e3),window.addEventListener("beforeunload",()=>this.flushViewTracker(!0))},flushViewTracker(e){if(0===this.pendingViews.size)return;const t=[...this.pendingViews];this.pendingViews.clear();const a=JSON.stringify({event_ids:t});e&&navigator.sendBeacon?navigator.sendBeacon("/api/feed/social/track-views",new Blob([a],{type:"application/json"})):fetch("/api/feed/social/track-views",{method:"POST",headers:{"Content-Type":"application/json"},body:a}).catch(()=>{})},openPostDetail(e){if(!e)return;const t=localStorage.getItem("auth_token")||localStorage.getItem("authToken"),a=t?{headers:{Authorization:"Bearer "+t}}:{};this._showPostDetailOverlay(),fetch("/api/feed/social/"+e,a).then(function(e){return e.json()}).then(function(t){if(!t.success||!t.data||!t.data.post)return SocialFeed._closePostDetail(),void(window.LaTandaPopup&&window.LaTandaPopup.showError("Publicación no encontrada"));SocialFeed._renderPostDetail(t.data.post,t.data.comments||[],t.data.total_comments||0);var a=new URL(window.location);a.searchParams.set("event",e),history.pushState({postDetail:e},"",a)}).catch(function(){SocialFeed._closePostDetail(),window.LaTandaPopup&&window.LaTandaPopup.showError("Error al cargar publicacion")})},_showPostDetailOverlay(){var e=document.getElementById("postDetailOverlay");e&&e.remove();var t=document.createElement("div");t.id="postDetailOverlay",t.className="pd-overlay",t.innerHTML='<div class="pd-modal"><div class="pd-loading"><i class="fas fa-spinner fa-spin"></i></div></div>',document.body.appendChild(t),document.body.style.overflow="hidden",t.addEventListener("click",function(e){e.target===t&&SocialFeed._closePostDetail()}),requestAnimationFrame(function(){t.classList.add("pd-active")})},_renderPostDetail(e,t,a){var s=document.getElementById("postDetailOverlay");if(s){var i=s.querySelector(".pd-modal");if(i){var o=e.metadata||{},n=!0===o.is_anonymous,r=e.actor||{},l=e.engagement||{},c=r.avatar_url?'<img src="'+this.escapeHtml(r.avatar_url)+'" alt="" class="avatar-fallback-img">':'<span style="color: '+(n?"#8b5cf6":"#00FFFF")+'">'+this.escapeHtml(r.initials||"??")+"</span>",d=!n&&r.verified?'<i class="fas fa-check-circle verified-badge"></i>':"",p=n?' <i class="fas fa-user-secret" style="color: #8b5cf6; font-size: 0.8rem;"></i>':"",m=o.location?'<span class="post-location-badge"><i class="fas fa-map-marker-alt"></i> '+this.escapeHtml(o.location)+"</span>":"",u=this.renderImageCarousel(e.image_url),h=this.renderPollDisplay(e),g=this.renderLinkPreviewCard(e),v="";v=t.length>0?t.map(function(e){var t=e.user.avatar_url?'<img src="'+SocialFeed.escapeHtml(e.user.avatar_url)+'" alt="" class="avatar-fallback-img">':"<span>"+SocialFeed.escapeHtml(e.user.initials||"??")+"</span>",a="";return e.replies&&e.replies.length>0&&(a='<div class="pd-replies">'+e.replies.map(function(e){return'<div class="pd-comment pd-reply"><div class="pd-comment-avatar">'+(e.user.avatar_url?'<img src="'+SocialFeed.escapeHtml(e.user.avatar_url)+'" alt="" class="avatar-fallback-img">':"<span>"+SocialFeed.escapeHtml(e.user.initials||"??")+"</span>")+'</div><div class="pd-comment-body"><span class="pd-comment-name">'+'<span translate="no">' + SocialFeed.escapeHtml(e.user.name) + '</span>'+'</span><span class="pd-comment-time">'+SocialFeed.escapeHtml(e.time_ago||"")+'</span><p class="pd-comment-text">'+SocialFeed.escapeHtml(e.content)+"</p></div></div>"}).join("")+"</div>"),'<div class="pd-comment"><div class="pd-comment-avatar">'+t+'</div><div class="pd-comment-body"><span class="pd-comment-name">'+'<span translate="no">' + SocialFeed.escapeHtml(e.user.name) + '</span>'+'</span><span class="pd-comment-time">'+SocialFeed.escapeHtml(e.time_ago||"")+'</span><p class="pd-comment-text">'+SocialFeed.escapeHtml(e.content)+"</p></div></div>"+a}).join(""):'<div class="pd-no-comments"><i class="far fa-comment"></i> Se el primero en comentar</div>';var f=l.likes||"",b=l.comments||"";i.innerHTML='<div class="pd-header"><button class="pd-close" id="pdCloseBtn"><i class="fas fa-arrow-left"></i></button><span class="pd-header-title">Publicación</span></div><div class="pd-scroll"><div class="pd-post"><div class="pd-post-header"><div class="pd-avatar '+(r.avatar_url?"has-image":"initials")+'"'+(n?"":' data-user-id="'+this.escapeHtml(String(r.id||""))+'" role="button" tabindex="0"')+' style="background: '+(n?"#8b5cf620":"rgba(0,255,255,0.12)")+'">'+c+d+'</div><div class="pd-actor-info"><span class="pd-actor-name"'+(n?"":' data-user-id="'+this.escapeHtml(String(r.id||""))+'" role="button" tabindex="0"')+">"+'<span translate="no">' + this.escapeHtml(r.name||"Usuario") + '</span>'+p+'</span><span class="pd-post-time">'+this.escapeHtml(e.time_ago||"")+m+'</span></div></div><div class="pd-post-content"><p class="pd-post-text">'+this.parseContent(e.description||e.title||"")+"</p>"+u+h+g+'</div><div class="pd-engagement-bar"><button class="engagement-btn like-btn'+(e.is_liked?" liked":"")+'" data-id="'+this.escapeHtml(String(e.id))+'"><i class="'+(e.is_liked?"fas":"far")+' fa-heart"></i> <span>'+f+'</span></button><button class="engagement-btn comment-btn pd-focus-input" data-id="'+this.escapeHtml(String(e.id))+'"><i class="far fa-comment"></i> <span>'+b+'</span></button><button class="engagement-btn share-btn" data-id="'+this.escapeHtml(String(e.id))+'"><i class="fas fa-share-alt"></i></button><button class="engagement-btn repost-btn'+(e.is_reposted?" reposted":"")+'" data-id="'+this.escapeHtml(String(e.id))+'"><i class="fas fa-retweet"></i> <span>'+(l.reposts||"")+'</span></button><button class="engagement-btn bookmark-btn'+(e.is_bookmarked?" bookmarked":"")+'" data-id="'+this.escapeHtml(String(e.id))+'"><i class="'+(e.is_bookmarked?"fas":"far")+' fa-bookmark"></i></button></div></div><div class="pd-comments-section"><h4 class="pd-comments-title">Comentarios <span>('+a+')</span></h4><div class="pd-comments-list">'+v+'</div></div></div><div class="pd-comment-input"><form class="pd-comment-form" id="pdCommentForm"><div class="pd-input-wrap"><textarea id="pdCommentInput" placeholder="Escribe un comentario..." maxlength="500" rows="1"></textarea><button type="submit" class="pd-submit-btn" id="pdSubmitBtn" disabled><i class="fas fa-paper-plane"></i></button></div></form></div>';var w=this,y=e.id;document.getElementById("pdCloseBtn").addEventListener("click",function(){w._closePostDetail()});var E=function(e){"Escape"===e.key&&(w._closePostDetail(),document.removeEventListener("keydown",E))};document.addEventListener("keydown",E);var L=i.querySelector(".like-btn");L&&L.addEventListener("click",function(e){e.preventDefault(),w.toggleLike(L)});var I=i.querySelector(".bookmark-btn");I&&I.addEventListener("click",function(e){e.preventDefault(),w.toggleBookmark(I)});var k=i.querySelector(".repost-btn");k&&k.addEventListener("click",function(e){e.preventDefault(),w.handleRepost(k)});var S=i.querySelector(".share-btn");S&&S.addEventListener("click",function(e){e.preventDefault(),w.shareEvent(y)});var P=i.querySelector(".pd-focus-input");P&&P.addEventListener("click",function(e){e.preventDefault();var t=document.getElementById("pdCommentInput");t&&t.focus()});var T=document.getElementById("pdCommentInput"),x=document.getElementById("pdSubmitBtn");T&&T.addEventListener("input",function(){x.disabled=!T.value.trim(),T.style.height="auto",T.style.height=Math.min(T.scrollHeight,120)+"px"});var B=document.getElementById("pdCommentForm");B&&B.addEventListener("submit",function(e){e.preventDefault(),w._submitPostDetailComment(y)}),i.addEventListener("click",function(e){var t=e.target.closest("[data-user-id]");if(t&&(t.classList.contains("pd-avatar")||t.classList.contains("pd-actor-name"))){var a=t.dataset.userId;if(a&&"null"!==a&&window.ProfileViewerModal)return e.preventDefault(),e.stopPropagation(),void window.ProfileViewerModal.open(a,"posts")}}),i.addEventListener("click",function(t){var a=t.target.closest("img.lightbox-trigger");if(a&&e.image_url){var s=[];if(e.image_url.startsWith("["))try{s=JSON.parse(e.image_url)}catch(t){s=[e.image_url]}else s=[e.image_url];var i=parseInt(a.dataset.lightboxIndex)||0;s.length>0&&w.openLightbox(s,i)}})}}},_submitPostDetailComment(e){var t=document.getElementById("pdCommentInput"),a=document.getElementById("pdSubmitBtn");if(t&&t.value.trim()){var s=localStorage.getItem("auth_token")||localStorage.getItem("authToken");if(s){var i=t.value.trim();a.disabled=!0,t.disabled=!0,fetch("/api/feed/social/"+e+"/comments",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s},body:JSON.stringify({content:i})}).then(function(e){return e.json()}).then(function(a){if(a.success){t.value="",t.style.height="auto",SocialFeed.openPostDetail(e);var s=document.querySelector('.social-card[data-event-id="'+e+'"] .comment-btn span');if(s){var i=parseInt(s.textContent)||0;s.textContent=i+1}}else window.LaTandaPopup&&window.LaTandaPopup.showError(a.message||"Error al comentar")}).catch(function(){window.LaTandaPopup&&window.LaTandaPopup.showError("Error al enviar comentario")}).finally(function(){a.disabled=!1,t.disabled=!1})}else window.LaTandaPopup&&window.LaTandaPopup.showError("Inicia sesion para comentar")}},_closePostDetail(){var e=document.getElementById("postDetailOverlay");e&&(e.classList.remove("pd-active"),setTimeout(function(){e.remove(),document.body.style.overflow=""},250));var t=new URL(window.location);t.searchParams.has("event")&&(t.searchParams.delete("event"),history.pushState({},"",t))},destroy(){this.observer&&(this.observer.disconnect(),this.observer=null),this.videoVisibilityObserver&&(this.videoVisibilityObserver.disconnect(),this.videoVisibilityObserver=null),this.viewObserver&&(this.viewObserver.disconnect(),this.viewObserver=null),this.viewFlushInterval&&(clearInterval(this.viewFlushInterval),this.viewFlushInterval=null),this.flushViewTracker(),this.events=[],this.offset=0,this.hasMore=!0}};document.addEventListener("DOMContentLoaded",()=>{document.getElementById("socialFeedContainer")&&SocialFeed.init("socialFeedContainer")});
// v4.25.12: iOS mobile file upload fix — overlay transparent input on media button
(function(){
if(!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)&&!(navigator.maxTouchPoints>0&&window.innerWidth<1024))return;
document.addEventListener('DOMContentLoaded',function(){
setTimeout(function(){
var btn=document.getElementById('composeMediaBtn');
var inp=document.getElementById('composeMediaInput');
if(!btn||!inp)return;
inp.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:10;';
btn.style.position='relative';
btn.style.overflow='visible';
btn.parentNode.style.position='relative';
inp.parentNode!==btn&&btn.appendChild(inp);
},1500);
});
})();

/* v4.25.14: Carousel touch swipe handler */
(function(){
 function initCarousel(el){
  var track=el.querySelector('.pd-carousel-track');
  var dots=el.querySelectorAll('.pd-carousel-dot');
  var counter=el.querySelector('.pd-carousel-counter');
  var slides=el.querySelectorAll('.pd-carousel-slide');
  if(!track||slides.length<2)return;
  var current=0,startX=0,diffX=0,dragging=false;
  var total=slides.length;
  function goTo(i){
   current=Math.max(0,Math.min(i,total-1));
   track.style.transform='translateX(-'+(current*100)+'%)';
   dots.forEach(function(d,j){d.classList.toggle('active',j===current)});
   if(counter)counter.textContent=(current+1)+' / '+total;
  }
  track.addEventListener('touchstart',function(e){
   startX=e.touches[0].clientX;diffX=0;dragging=true;
   track.classList.add('dragging');
  },{passive:true});
  track.addEventListener('touchmove',function(e){
   if(!dragging)return;
   diffX=e.touches[0].clientX-startX;
   var offset=-(current*100)+(diffX/el.offsetWidth*100);
   track.style.transform='translateX('+offset+'%)';
  },{passive:true});
  track.addEventListener('touchend',function(){
   if(!dragging)return;dragging=false;
   track.classList.remove('dragging');
   if(Math.abs(diffX)>50){goTo(diffX>0?current-1:current+1)}
   else{goTo(current)}
   diffX=0;
  });
  dots.forEach(function(d){d.addEventListener('click',function(){goTo(Number(d.dataset.slide))})});
 }
 var obs=new MutationObserver(function(mutations){
  mutations.forEach(function(m){
   m.addedNodes.forEach(function(n){
    if(n.nodeType===1){
     var c=n.querySelector?n.querySelector('.pd-image-carousel'):null;
     if(c)initCarousel(c);
     if(n.classList&&n.classList.contains('pd-image-carousel'))initCarousel(n);
    }
   });
  });
 });
 obs.observe(document.body,{childList:true,subtree:true});
})();
/* v4.25.15: Stories Methods */
SocialFeed.loadStories=function(){console.log("[STORIES] loadStories called, bar:",document.getElementById("storiesBar"));
 var token=localStorage.getItem("auth_token")||localStorage.getItem("authToken");
 var h=token?{Authorization:"Bearer "+token}:{};
 fetch("/api/stories",{headers:h}).then(function(r){return r.json()}).then(function(d){
  if(d.success)SocialFeed._renderStoriesBar(d.data||[]);
 }).catch(function(){});
 SocialFeed._loadDiscoverStories();
};

SocialFeed._storiesData=null;
SocialFeed._viewerData=null;
SocialFeed._discoverData=null;
SocialFeed._storyTimer=null;
SocialFeed._storyPaused=false;
SocialFeed._currentUserIdx=0;
SocialFeed._currentStoryIdx=0;

/* ════════ HISTORIAS 3D — motor LtcSt3d (fichas en la repisa, variante B) ════════
   Fuente: prototipo aprobado historias-preview.html (header comment = mapping).
   API: mount(root) / refresh(root) / ringSvg(shape,n,uid,c1,c2) / EMPTY_PHRASES.
   CSS gemelo: <style id="ltc-st3d-css"> en home-dashboard.html (Fase A zone).
   El visor y el creador de historias NO cambian — solo el skin de la barra. */
window.LtcSt3d=(function(){
  var SPANMIN=200,SPANMAX=560,YAW=26,ZMAX=260,P=940,DXK=.36,DYK=9,DIMK=.34;
  var VARS=['--yaw','--z','--dx','--dy','--dim','--sh','--shx','--bo','--no'];
  var ROTMS=12000,FADEMS=480;
  var reduce=false;
  try{reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){}

  /* frases del estado vacío (la 1ª es la base aprobada) */
  var EMPTY_PHRASES=[
    'Contá cómo va tu tanda hoy. Se borra en 24 horas.',
    'Mostrale tu negocio a la comunidad: con una foto alcanza.',
    '¿Te tocó tu turno? Celebralo acá — dura 24 horas.',
    'Un consejo de ahorro vale oro. Compartilo con los tuyos.',
    '¿Abriste tanda nueva? Contale a tu gente que hay cupo.',
    'Tu día en una historia. Mañana la barra arranca de cero.'
  ];

  /* SILUETA (única): gemelo en SVG de lo que dibuja --st3d-br.
     wpx = ancho físico BASE de la ficha (css --st3d-h móvil): las unidades del
     viewBox (100 de ancho) se escalan con él → mantener sincronizado. */
  var SHAPES={
    arch  :{H:97.5,wpx:124,dome:.64,rb:11}
  };
  SHAPES.arch.d=function(H,m){
    var x0=m,x1=100-m,yb=H-m,yt=m,rb=SHAPES.arch.rb,rx=50-m,dh=H*SHAPES.arch.dome,ys=yt+dh;
    var f=function(v){return v.toFixed(2)};
    return 'M50 '+f(yb)+'L'+f(x1-rb)+' '+f(yb)+
           'A'+f(rb)+' '+f(rb)+' 0 0 0 '+f(x1)+' '+f(yb-rb)+
           'L'+f(x1)+' '+f(ys)+
           'A'+f(rx)+' '+f(dh)+' 0 0 0 '+f(x0)+' '+f(ys)+
           'L'+f(x0)+' '+f(yb-rb)+
           'A'+f(rb)+' '+f(rb)+' 0 0 0 '+f(x0+rb)+' '+f(yb)+'Z';
  };

  /* aro segmentado: 1 tramo por historia, repartido por LONGITUD de trazo */
  function ringSvg(shape,n,uid,c1,c2){
    var S=SHAPES[shape]||SHAPES.arch,H=S.H;
    var sw=2.1*100/S.wpx;  /* ~2.1px de trazo al ancho base (aro fino) */
    var d=S.d(H,sw/2);
    n=Math.max(1,Math.min(12,n|0));
    var dash='';
    if(n>1){
      var gap=n<=2?2.9:n<=4?2.5:n<=6?2.1:1.7,cyc=100/n;
      dash=' pathLength="100" stroke-dasharray="'+(cyc-gap).toFixed(2)+' '+gap+
           '" stroke-dashoffset="'+(-gap/2).toFixed(2)+'"';
    }
    var gid='ltcSt3dRg'+uid;
    return '<svg class="ltc-st3d-ring" viewBox="0 0 100 '+H+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
             '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="100" y2="'+H+'" gradientUnits="userSpaceOnUse">'+
               '<stop offset="0" stop-color="'+(c1||'#00d4ff')+'"/>'+
               '<stop offset="1" stop-color="'+(c2||c1||'#8b5cf6')+'"/>'+
             '</linearGradient></defs>'+
             '<path d="'+d+'" stroke="url(#'+gid+')" stroke-width="'+sw.toFixed(2)+'"'+dash+'/>'+
           '</svg>';
  }

  function mount(root){
    if(!root)return;
    var track=root.querySelector('.ltc-st3d-track');
    if(!track)return;
    var items=[],focus=0,raf=0,lastSL=-1;
    function flat(){return reduce||root.hasAttribute('data-flat')}

    function rotate(){
      var el=root.querySelector('[data-st3d-rot]');
      if(root.__rotEl===el&&root.__rot)return;
      clearInterval(root.__rot);root.__rot=0;root.__rotEl=el;
      if(!el)return;
      el.textContent=EMPTY_PHRASES[0];
      if(flat()||EMPTY_PHRASES.length<2)return;
      var i=0;
      root.__rot=setInterval(function(){
        if(document.hidden||!el.isConnected)return;
        i=(i+1)%EMPTY_PHRASES.length;
        el.style.opacity='0';
        setTimeout(function(){el.textContent=EMPTY_PHRASES[i];el.style.opacity='1'},FADEMS);
      },ROTMS);
    }

    function measure(){
      items=[].slice.call(track.querySelectorAll('.ltc-st3d-item')).map(function(el){
        return {el:el,cx:el.offsetLeft+el.offsetWidth/2};
      });
      focus=items.length?items[0].cx-track.scrollLeft:0;
      if(flat()){items.forEach(function(it){VARS.forEach(function(k){it.el.style.removeProperty(k)});it.el.style.removeProperty('z-index')})}
      apply();syncNav();rotate();
    }
    function apply(){
      raf=0;
      if(flat()||!items.length)return;
      var sl=track.scrollLeft,W=track.clientWidth;
      var span=Math.max(SPANMIN,Math.min(SPANMAX,W*.8));
      for(var i=0;i<items.length;i++){
        var it=items[i],x=it.cx-sl,t=(x-focus)/span;
        if(t>1)t=1;else if(t<-.3)t=-.3;
        var z=-t*ZMAX,s=P/(P-z),dx=(x-focus)*(s-1)*DXK;
        var st=it.el.style;
        st.setProperty('--yaw',(t*YAW).toFixed(2)+'deg');
        st.setProperty('--z',z.toFixed(1)+'px');
        st.setProperty('--dx',dx.toFixed(1)+'px');
        st.setProperty('--dy',(-t*DYK).toFixed(1)+'px');
        st.setProperty('--dim',(t>0?t*DIMK:0).toFixed(3));
        st.setProperty('--sh',(t>0?.95-t*.35:.95).toFixed(3));
        st.setProperty('--shx',(1+(t>0?t*.36:0)).toFixed(3));
        st.setProperty('--bo',(t>0?.8-t*.45:.8).toFixed(3));
        st.setProperty('--no',(1-(t>0?t*.18:0)).toFixed(3));
        it.el.style.zIndex=String(40-Math.round(t*20));
      }
      lastSL=sl;
    }
    function onScroll(){
      if(flat())return;
      if(track.scrollLeft===lastSL)return;
      if(!raf)raf=requestAnimationFrame(apply);
      syncNav();
    }
    var prev=root.querySelector('.ltc-st3d-nav.prev'),next=root.querySelector('.ltc-st3d-nav.next');
    function syncNav(){
      if(!prev||!next)return;
      var max=track.scrollWidth-track.clientWidth-2;
      prev.disabled=track.scrollLeft<=2;
      next.disabled=track.scrollLeft>=max;
    }
    function nudge(d){track.scrollBy({left:d*Math.max(160,track.clientWidth*.6),behavior:'smooth'})}
    if(prev)prev.addEventListener('click',function(){nudge(-1)});
    if(next)next.addEventListener('click',function(){nudge(1)});

    track.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',function(){clearTimeout(root.__rt);root.__rt=setTimeout(measure,120)});
    track.addEventListener('focusin',function(e){
      var it=e.target.closest?e.target.closest('.ltc-st3d-item'):null;
      if(it&&it.scrollIntoView)it.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    });
    root.__measure=measure;
    measure();
  }
  function refresh(root){if(root&&root.__measure)root.__measure();else mount(root)}
  return {mount:mount,refresh:refresh,ringSvg:ringSvg,SHAPES:SHAPES,EMPTY_PHRASES:EMPTY_PHRASES};
})();

/* HISTORIAS 3D skin de la barra: mismo data-* + mismo delegado de click que
   la versión plana; solo cambia el markup (button.ltc-st3d-item + coin/ring). */
SocialFeed._renderStoriesBar=function(groups){console.log("[STORIES] _renderStoriesBar called, groups:",groups?groups.length:"null");
 var bar=document.getElementById("storiesBar");
 if(!bar)return;
 /* Fase A: on pages with a #storiesHost (home-dashboard greeting zone), the
    stories bar lives in the feed header. Greeting compacts when stories exist. */
 var host=document.getElementById("storiesHost");
 if(host&&bar.parentElement!==host)host.appendChild(bar);
 /* skin swap (una sola vez): #storiesBar pasa a ser la sección 3D con repisa */
 if(!bar.classList.contains("ltc-st3d")){
  bar.className="ltc-st3d";
  bar.setAttribute("data-shape","arch");
  bar.setAttribute("aria-label","Historias");
  bar.innerHTML='<div class="ltc-st3d-shelf" aria-hidden="true"></div>'+
   '<div class="ltc-st3d-pool" aria-hidden="true"></div>'+
   '<button class="ltc-st3d-nav prev" type="button" aria-label="Historias anteriores"><i class="fas fa-chevron-left"></i></button>'+
   '<button class="ltc-st3d-nav next" type="button" aria-label="Más historias"><i class="fas fa-chevron-right"></i></button>'+
   '<div class="ltc-st3d-track" role="list"></div>';
 }
 var scroll=bar.querySelector(".ltc-st3d-track");
 if(!scroll)return;
 var me=null;
 try{var u=localStorage.getItem("latanda_user")||sessionStorage.getItem("latanda_user");if(u)me=JSON.parse(u)}catch(e){}
 var esc=function(s){return SocialFeed.escapeHtml(s)};
 var PAL=[["#00d4ff","#7ce7ff"],["#8b5cf6","#c4b5fd"],["#ffd700","#ffe680"],["#ff9944","#ffc08a"],["#22d55e","#86efac"],["#5eead4","#a7f3e4"],["#ec4899","#f9a8d4"]];
 function coin(ring,inner,extra){
  return '<span class="ltc-st3d-stage"><span class="ltc-st3d-coin">'+
   '<span class="ltc-st3d-edge3"></span><span class="ltc-st3d-edge2"></span><span class="ltc-st3d-edge"></span>'+
   ring+'<span class="ltc-st3d-face">'+inner+'<span class="ltc-st3d-gloss"></span><span class="ltc-st3d-scrim"></span></span>'+
   (extra||'')+'</span></span>';
 }
 var fxs='<span class="ltc-st3d-bounce" aria-hidden="true"></span><span class="ltc-st3d-shadow" aria-hidden="true"></span>';
 var badge='<span class="ltc-st3d-badge" aria-hidden="true">+</span>';
 var ownGroup=groups.find(function(g){return g.is_own});
 var myAvatar=me?(me.avatar_url||me.profile_image_url||""):"";
 var myName=me?(me.name||me.full_name||"Tu"):"Tu";
 var myInitials=myName.split(" ").map(function(w){return w[0]}).join("").substring(0,2).toUpperCase();
 var myFace=myAvatar?'<img src="'+esc(myAvatar)+'" alt="">':'<span class="ltc-st3d-ini">'+esc(myInitials)+'</span>';
 var html="";

 if(ownGroup&&ownGroup.stories.length>0){
  html+='<button type="button" role="listitem" class="ltc-st3d-item'+(ownGroup.has_unseen?'':' is-seen')+(SocialFeed._cfIsGroup(ownGroup)?' ltc-st3d-cf':'')+'" data-user-index="0" data-user-id="own" style="--ac:#00d4ff;--at:#7ce7ff" aria-label="Tu historia">'+
   fxs+coin(LtcSt3d.ringSvg("arch",ownGroup.stories.length,"own","#00d4ff","#8b5cf6"),myFace,badge)+
   '<span class="ltc-st3d-name">Tu historia</span></button>';
 }else{
  html+='<button type="button" role="listitem" class="ltc-st3d-item is-cta" data-action="create-story" style="--ac:#00d4ff;--at:#7ce7ff" aria-label="Crear tu historia">'+
   fxs+coin(LtcSt3d.ringSvg("arch",1,"cta","#00d4ff","#8b5cf6"),myFace,badge)+
   '<span class="ltc-st3d-name">Tu historia</span></button>';
 }

 var idx=ownGroup?1:0;
 groups.forEach(function(g){
  if(g.is_own)return;
  var avatar=g.user.avatar_url||"";
  var name=(g.user.name||"").split(" ")[0]||"Usuario";
  var initials=(g.user.name||"U").split(" ").map(function(w){return w[0]}).join("").substring(0,2).toUpperCase();
  var p=PAL[idx%PAL.length];
  var inner=avatar?'<img src="'+esc(avatar)+'" alt="">':'<span class="ltc-st3d-ini">'+esc(initials)+'</span>';
  html+='<button type="button" role="listitem" class="ltc-st3d-item'+(g.has_unseen?'':' is-seen')+(SocialFeed._cfIsGroup(g)?' ltc-st3d-cf':'')+'" data-user-index="'+idx+'" data-user-id="'+esc(g.user.id)+'" style="--ac:'+p[0]+';--at:'+p[1]+'" aria-label="Historia de '+esc(name)+(g.has_unseen?(g.stories.length>1?', '+g.stories.length+' nuevas':', nueva'):', ya vista')+'">'+
   fxs+coin(LtcSt3d.ringSvg("arch",g.stories.length,idx,p[0],p[1]),inner)+
   '<span class="ltc-st3d-name">'+esc(name)+'</span></button>';
  idx++;
 });

 var hasStories=!!(groups&&groups.length>0);
 if(!hasStories){
  html+='<div class="ltc-st3d-empty"><b>Todavía no hay historias</b><span data-st3d-rot>'+LtcSt3d.EMPTY_PHRASES[0]+'</span></div>';
 }
 bar.classList.toggle("is-empty",!hasStories);
 scroll.innerHTML=html;
 SocialFeed._storiesData=groups;

 scroll.querySelectorAll(".ltc-st3d-item").forEach(function(item){
  item.addEventListener("click",function(ev){
   var plus=ev.target&&ev.target.closest?ev.target.closest(".ltc-st3d-badge"):null;
   if(item.dataset.action==="create-story"||plus){SocialFeed._openStoryCreator()}
   else if(item.dataset.userId==="own"&&SocialFeed._storiesData){SocialFeed._openStoryViewer(0,0)}
   else{SocialFeed._openStoryViewer(parseInt(item.dataset.userIndex),0)}
  });
 });
 if(window.LtcSt3d)LtcSt3d.refresh(bar);
 /* Banner v5 (founder): the greeting greets ~15s, then CROSSFADES into the
    info ticker (#feedTicker: clima + tasas) in the same band — in BOTH
    story-states. Degradation: ticker sin datos + stories -> band collapses
    (greeting-hidden only, no dead gap); ticker sin datos + NO stories ->
    the greeting persists. _tkApply() arbitrates on timer fire, on data
    arrival and on re-renders. */
 var hdr=document.getElementById("mainFeedHeader");
 if(hdr&&host){
  hdr.classList.toggle("has-stories",hasStories);
  SocialFeed._hasStories=hasStories;
  if(!SocialFeed._greetFadeTimer&&!SocialFeed._greetElapsed){
   SocialFeed._greetFadeTimer=setTimeout(function(){
    SocialFeed._greetElapsed=true;SocialFeed._tkApply();
   },15000);
  }
  SocialFeed._tkInit();
  SocialFeed._tkApply();
 }
};

/* ══════ EXPLORAR · datos de descubrimiento de historias (NO-seguidos) ══════
   GET /api/stories?scope=discover devuelve el MISMO shape que GET /api/stories
   (array de {user,stories[],has_unseen,is_own} de usuarios que NO seguís).
   Esta función SOLO trae y normaliza los datos en SocialFeed._discoverData; el
   RENDER del rail "Explorar" vive en la superficie visible (home-dashboard.html
   strip de historias) y reusa el MISMO render de burbuja (makeCstory) + el MISMO
   visor vía SocialFeed._openStoryViewerFor(_discoverData,idx). Red de seguridad:
   filtra historia válida, no-propia y dedupe contra _storiesData (seguidos),
   por si el backend aún no interpreta scope=discover. cb = re-render opcional. */
SocialFeed._discoverCb=null;
SocialFeed._loadDiscoverStories=function(cb){
 if(typeof cb==="function")SocialFeed._discoverCb=cb;
 if(!document.getElementById("storiesBar")){SocialFeed._discoverData=[];return;}  /* solo home (donde vive la barra) */
 var token=localStorage.getItem("auth_token")||localStorage.getItem("authToken");
 var h=token?{Authorization:"Bearer "+token}:{};
 fetch("/api/stories?scope=discover",{headers:h}).then(function(r){return r.json()}).then(function(d){
  SocialFeed._setDiscoverData((d&&d.success&&Array.isArray(d.data))?d.data:[]);
 }).catch(function(){SocialFeed._setDiscoverData([])});
};
SocialFeed._setDiscoverData=function(groups){
 var seen={};
 (SocialFeed._storiesData||[]).forEach(function(g){if(g&&g.user&&g.user.id!=null)seen[String(g.user.id)]=1});
 SocialFeed._discoverData=(Array.isArray(groups)?groups:[]).filter(function(g){
  return g&&g.user&&g.stories&&g.stories.length>0&&!g.is_own&&!seen[String(g.user.id)];
 });
 if(typeof SocialFeed._discoverCb==="function"){try{SocialFeed._discoverCb()}catch(e){}}
 /* la superficie visible (home strip) escucha esto para re-renderizar "Explorar"
    sin depender del orden de carga del script (const SocialFeed no vive en window). */
 try{document.dispatchEvent(new CustomEvent("ltc:discover-updated"))}catch(e){}
};

/* ══════ INFO TICKER (clima + cambio) — llena la banda del saludo ══════
   GET /api/feed/ticker?lat=&lon= (el backend cae a Tegucigalpa sin params).
   Cada sección null/fallida = chip oculto; sin NINGÚN dato el banner degrada
   (ver _tkApply). Refresh cada 15 min. Chips que no entran en una fila ->
   modo rotación (1 chip cada 6s, crossfade); reduced-motion = fila estática. */
SocialFeed._hasStories=false;
SocialFeed._greetElapsed=false;
SocialFeed._tkChips=[];
SocialFeed._tkStarted=false;
SocialFeed._tkCoords=null;
SocialFeed._tkRotTimer=null;

SocialFeed._tkInit=function(){
 if(SocialFeed._tkStarted)return;
 if(!document.getElementById("feedTicker"))return;
 SocialFeed._tkStarted=true;
 /* geoloc rápida (cap 3s) -> lat/lon; si no, sin params (default backend) */
 var done=false;
 var go=function(coords){if(done)return;done=true;SocialFeed._tkCoords=coords||null;SocialFeed._tkFetch();
  setInterval(SocialFeed._tkFetch,9e5)};
 try{
  if(navigator.geolocation){
   navigator.geolocation.getCurrentPosition(
    function(p){go({lat:p.coords.latitude,lon:p.coords.longitude})},
    function(){go(null)},{timeout:3000,maximumAge:36e5});
   setTimeout(function(){go(null)},3200);
  }else go(null);
 }catch(e){go(null)}
};

SocialFeed._tkFetch=function(){
 var token=localStorage.getItem("auth_token")||localStorage.getItem("authToken");
 var h=token?{Authorization:"Bearer "+token}:{};
 var url="/api/feed/ticker";
 var c=SocialFeed._tkCoords;
 if(c&&isFinite(c.lat)&&isFinite(c.lon))url+="?lat="+encodeURIComponent(c.lat)+"&lon="+encodeURIComponent(c.lon);
 fetch(url,{headers:h}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
  var data=(d&&(d.data||d))||{};
  var chips=[];
  /* shape real: weather.{temp_c,code,is_day} + fx.{usd_hnl,eur_hnl} +
     crypto.{btc_usd}; se aceptan también los alias temp/weather_code/rates */
  var w=data.weather;
  if(w){
   var t=w.temp_c!=null?w.temp_c:w.temp;
   if(t!=null&&isFinite(+t))chips.push({i:SocialFeed._tkWxIcon(w.code!=null?w.code:w.weather_code,w.is_day),t:Math.round(+t)+"°C"});
  }
  var fx=data.fx||data.rates||{};
  if(fx.usd_hnl!=null&&isFinite(+fx.usd_hnl))chips.push({i:"💵",t:"$1 = L "+(+fx.usd_hnl).toFixed(2)});
  if(fx.eur_hnl!=null&&isFinite(+fx.eur_hnl))chips.push({i:"💶",t:"€1 = L "+(+fx.eur_hnl).toFixed(2)});
  var cr=data.crypto||fx;
  if(cr.btc_usd!=null&&isFinite(+cr.btc_usd))chips.push({i:"₿",t:SocialFeed._tkAbbr(+cr.btc_usd)});
  if(chips.length){SocialFeed._tkChips=chips;SocialFeed._tkRender()}
  SocialFeed._tkApply();
 }).catch(function(){SocialFeed._tkApply()});
};

/* weather_code (WMO/open-meteo) -> emoji simple; is_day decide sol/luna */
SocialFeed._tkWxIcon=function(code,isDay){
 var day=isDay==null?true:!!(+isDay);
 var c=+code;
 if(!isFinite(c))return day?"☀️":"🌙";
 if(c<=1)return day?"☀️":"🌙";            /* despejado */
 if(c===2)return day?"⛅":"☁️";                 /* parcial */
 if(c===3||c===45||c===48)return "☁️";              /* nublado/niebla */
 if(c>=95)return "⛈️";                              /* tormenta */
 if((c>=71&&c<=77)||c===85||c===86)return "🌨️"; /* nieve */
 return "🌧️";                                 /* lluvia */
};
SocialFeed._tkAbbr=function(v){
 if(v>=1e6)return "$"+(v/1e6).toFixed(1)+"M";
 if(v>=1e3)return "$"+(v/1e3).toFixed(1)+"k";
 return "$"+Math.round(v);
};

SocialFeed._tkRender=function(){
 var el=document.getElementById("feedTicker");
 if(!el)return;
 var html="";
 SocialFeed._tkChips.forEach(function(ch,i){
  html+='<span class="ft-chip'+(i===0?" is-on":"")+'"><span class="ft-ico" aria-hidden="true">'+ch.i+'</span>'+SocialFeed.escapeHtml(ch.t)+'</span>';
 });
 el.innerHTML=html;
 /* ¿entran todos en una fila? si no -> rotación (salvo reduced-motion: 1º chip fijo) */
 var reduce=false;
 try{reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){}
 el.classList.remove("is-rot");
 var fits=el.scrollWidth<=el.clientWidth+4||el.clientWidth===0;
 if(SocialFeed._tkRotTimer){clearInterval(SocialFeed._tkRotTimer);SocialFeed._tkRotTimer=null}
 if(!fits){
  el.classList.add("is-rot");
  if(!reduce&&SocialFeed._tkChips.length>1){
   var idx=0;
   SocialFeed._tkRotTimer=setInterval(function(){
    if(document.hidden||!el.isConnected)return;
    var chips=el.querySelectorAll(".ft-chip");
    if(!chips.length)return;
    chips[idx%chips.length].classList.remove("is-on");
    idx++;
    chips[idx%chips.length].classList.add("is-on");
   },6000);
  }
 }
};

/* árbitro del estado de la banda: saludo vs ticker vs colapso */
SocialFeed._tkApply=function(){
 var hdr=document.getElementById("mainFeedHeader");
 if(!hdr)return;
 if(!SocialFeed._greetElapsed)return;          /* el saludo todavía saluda */
 var hasTicker=SocialFeed._tkChips.length>0;
 if(hasTicker){
  hdr.classList.add("greeting-hidden","ticker-on");
  /* re-medir por si el ancho cambió mientras estaba a 0 de alto */
  var el=document.getElementById("feedTicker");
  if(el&&!el.__tkMeasured){el.__tkMeasured=true;setTimeout(SocialFeed._tkRender,500)}
 }else if(SocialFeed._hasStories){
  hdr.classList.remove("ticker-on");
  hdr.classList.add("greeting-hidden");        /* banda colapsa: sin hueco muerto */
 }else{
  hdr.classList.remove("ticker-on","greeting-hidden");  /* saludo persiste */
 }
};

SocialFeed._openStoryViewer=function(userIdx,storyIdx){
 return SocialFeed._openStoryViewerFor(SocialFeed._storiesData,userIdx,storyIdx);
};
/* Visor generalizado: abre contra CUALQUIER array con el shape de /api/stories
   (barra de seguidos o rail Explorar). _viewerData = fuente activa del visor. */
SocialFeed._openStoryViewerFor=function(dataArr,userIdx,storyIdx,isHighlight){
 var groups=dataArr;
 if(!groups||!groups[userIdx])return;
 SocialFeed._viewerData=groups;
 SocialFeed._viewerIsHighlight=!!isHighlight;
 SocialFeed._currentUserIdx=userIdx;
 SocialFeed._currentStoryIdx=storyIdx||0;
 var ov=document.createElement("div");
 ov.className="story-viewer-overlay";
 ov.id="storyViewerOverlay";
 document.body.appendChild(ov);
 document.body.style.overflow="hidden";
 requestAnimationFrame(function(){ov.classList.add("active")});
 SocialFeed._renderStory();
};

SocialFeed._renderStory=function(){
 var ov=document.getElementById("storyViewerOverlay");
 if(!ov)return;
 SocialFeed._storyPaused=false;
 ov.classList.remove("ltc-sv1-dim");
 var groups=SocialFeed._viewerData||SocialFeed._storiesData;
 var g=groups[SocialFeed._currentUserIdx];
 if(!g){SocialFeed._closeViewer();return}
 var story=g.stories[SocialFeed._currentStoryIdx];
 if(!story){SocialFeed._closeViewer();return}
 var user=g.user;var isOwn=g.is_own;var isHl=!!SocialFeed._viewerIsHighlight;
 var avatar=user.avatar_url||"";
 var initials=(user.name||"U").split(" ").map(function(w){return w[0]}).join("").substring(0,2).toUpperCase();
 var ago="";
 try{var diff=Date.now()-new Date(story.created_at).getTime();var mins=Math.floor(diff/60000);ago=mins<60?mins+"m":Math.floor(mins/60)+"h"}catch(e){}

 var prog='<div class="sv-progress-bar">';
 g.stories.forEach(function(s,i){
  var cls=i<SocialFeed._currentStoryIdx?"completed":i===SocialFeed._currentStoryIdx?"active":"";
  prog+='<div class="sv-progress-segment '+cls+'"><div class="sv-progress-fill"></div></div>';
 });
 prog+="</div>";

 var media="";
 if(story.media_type==="video"){media='<video class="sv-media-video" src="'+SocialFeed.escapeHtml(story.media_url)+'" playsinline autoplay></video>'}
 else{media='<img class="sv-media" src="'+SocialFeed.escapeHtml(story.media_url)+'" alt="">'}

 var cap=story.caption?'<div class="sv-caption">'+SocialFeed.escapeHtml(story.caption)+"</div>":"";
 /* CF-PULIDO FIX3(b): etiqueta de alcance. Graceful: sin `audience` -> sin etiqueta. */
 try{SocialFeed._cfInjectCss();}catch(e){}
 var cfTag=(story&&story.audience==="close_friends")?'<div class="ltc-sv-cf"><i class="fas fa-star" aria-hidden="true"></i> Amigos cercanos</div>':"";
 /* ltc-sv1: own story -> tappable viewers affordance (opens slide-up sheet) */
 var vc=(isOwn&&!isHl)?'<button type="button" class="ltc-sv1-views" id="sv1Views" aria-label="Ver quién vio tu historia"><i class="fas fa-eye" aria-hidden="true"></i><span>'+(story.view_count||0)+"</span></button>":"";
 var hlAct="";try{SocialFeed._hlInjectCss();}catch(e){}
 if(isHl){if(isOwn){hlAct='<button type="button" class="ltc-hl-act ltc-hl-rm" id="svHlRemove" aria-label="Quitar de la destacada"><i class="fas fa-trash-can" aria-hidden="true"></i> Quitar</button>';}}
 else if(isOwn&&story.audience!=="close_friends"){hlAct='<button type="button" class="ltc-hl-act" id="svHlAdd" aria-label="Destacar esta historia"><i class="fas fa-circle-plus" aria-hidden="true"></i> Destacar</button>';}

 var _pvTap=(user&&user.id)?' role="button" tabindex="0" title="Ver perfil" style="cursor:pointer;" onclick="window.location.href=\'/perfil.html?id='+encodeURIComponent(String(user.id))+'\'"':'';
 ov.innerHTML=prog+
  '<div class="sv-header"><div class="sv-avatar"'+_pvTap+'>'+(avatar?'<img src="'+SocialFeed.escapeHtml(avatar)+'" alt="">':'<span class="sv-initials">'+SocialFeed.escapeHtml(initials)+"</span>")+'</div>'+
  '<div class="sv-user-info"><span class="sv-user-name"'+_pvTap+'>'+'<span translate="no">' + SocialFeed.escapeHtml(user.name||"Usuario") + '</span>'+'</span><span class="sv-time">'+ago+"</span></div>"+
  '<button class="sv-close" id="svClose"><i class="fas fa-times"></i></button></div>'+cfTag+
  '<div class="sv-content"><div class="sv-tap-left" id="svTapLeft"></div><div class="sv-tap-right" id="svTapRight"></div>'+media+cap+vc+hlAct+"</div>"+
  ((isOwn||isHl)?"":('<div class="sv-reply-bar ltc-sv1-bar"><div class="ltc-sv1-emojis" role="group" aria-label="Reaccionar a la historia">'+SocialFeed._sv1Emojis.map(function(em){return '<button type="button" class="ltc-sv1-emoji'+(story._myReaction===em?" is-on":"")+'" data-emoji="'+em+'" aria-label="Reaccionar con '+em+'">'+em+"</button>"}).join("")+'</div><div class="ltc-sv1-replyrow"><input class="sv-reply-input" id="svReplyInput" placeholder="Responder..." maxlength="500" autocomplete="off"><button type="button" class="sv-reply-send ltc-sv1-send" id="svReplySend" aria-label="Enviar respuesta"><i class="fas fa-paper-plane"></i></button></div></div>'));

 document.getElementById("svClose").addEventListener("click",function(){SocialFeed._closeViewer()});
 document.getElementById("svTapLeft").addEventListener("click",function(){SocialFeed._advStory(-1)});
 document.getElementById("svTapRight").addEventListener("click",function(){SocialFeed._advStory(1)});

 // Long press pause
 var content=ov.querySelector(".sv-content");var pt=null;
 content.addEventListener("touchstart",function(e){if(e.target.closest(".sv-reply-bar"))return;pt=setTimeout(function(){SocialFeed._storyPaused=true},300)},{passive:true});
 content.addEventListener("touchend",function(){clearTimeout(pt);if(SocialFeed._storyPaused)SocialFeed._storyPaused=false});

 // ltc-sv1: viewers sheet (own) / reactions + reply DM (others)
 if(!isHl)SocialFeed._sv1Wire(story,isOwn);
 (function(){var ab=document.getElementById("svHlAdd");if(ab)ab.addEventListener("click",function(e){e.stopPropagation();SocialFeed._storyPaused=true;SocialFeed._openHighlightPicker(story.id);});var rb=document.getElementById("svHlRemove");if(rb)rb.addEventListener("click",function(e){e.stopPropagation();SocialFeed._storyPaused=true;SocialFeed._hlRemoveItemFromViewer(story);});})();

 // Mark viewed
 if(!isOwn&&!isHl&&!story.viewed){
  var tk=localStorage.getItem("auth_token")||localStorage.getItem("authToken");
  if(tk){fetch("/api/stories/"+story.id,{headers:{Authorization:"Bearer "+tk}}).catch(function(){});story.viewed=true}
 }

 // Auto-advance
 SocialFeed._startStoryTimer(story.media_type==="video"?null:5000);
 if(story.media_type==="video"){var vid=ov.querySelector("video");if(vid)vid.addEventListener("ended",function(){SocialFeed._advStory(1)})}
};

SocialFeed._startStoryTimer=function(dur){
 clearInterval(SocialFeed._storyTimer);
 if(!dur)return;
 var fill=document.querySelector(".sv-progress-segment.active .sv-progress-fill");
 var el=0,step=50;
 SocialFeed._storyTimer=setInterval(function(){
  if(SocialFeed._storyPaused)return;
  el+=step;var pct=Math.min(el/dur*100,100);
  if(fill)fill.style.width=pct+"%";
  if(el>=dur){clearInterval(SocialFeed._storyTimer);SocialFeed._advStory(1)}
 },step);
};

SocialFeed._advStory=function(dir){
 clearInterval(SocialFeed._storyTimer);
 var groups=SocialFeed._viewerData||SocialFeed._storiesData;if(!groups)return;
 var ni=SocialFeed._currentStoryIdx+dir;
 var g=groups[SocialFeed._currentUserIdx];
 if(ni>=0&&ni<g.stories.length){SocialFeed._currentStoryIdx=ni;SocialFeed._renderStory()}
 else if(dir>0){var nu=SocialFeed._currentUserIdx+1;if(nu<groups.length){SocialFeed._currentUserIdx=nu;SocialFeed._currentStoryIdx=0;SocialFeed._renderStory()}else{SocialFeed._closeViewer()}}
 else if(dir<0){var pu=SocialFeed._currentUserIdx-1;if(pu>=0){SocialFeed._currentUserIdx=pu;SocialFeed._currentStoryIdx=groups[pu].stories.length-1;SocialFeed._renderStory()}}
};

SocialFeed._closeViewer=function(){
 clearInterval(SocialFeed._storyTimer);
 SocialFeed._storyPaused=false;
 var ov=document.getElementById("storyViewerOverlay");
 if(ov){ov.classList.remove("active");setTimeout(function(){ov.remove();document.body.style.overflow=""},250)}
 if(!SocialFeed._viewerIsHighlight)SocialFeed.loadStories();
 SocialFeed._viewerIsHighlight=false;
};

/* ═══ Historias v2 · creation tools (text-over-image + stickers) ═══
   Client-side canvas compositing: layers are flattened onto a <canvas> at the
   image's natural resolution, exported to a JPEG blob, and fed into the SAME
   upload path the old creator used (POST /api/upload/social-image → media_url →
   POST /api/stories). Backend/viewer/schema unchanged. Video keeps raw upload. */
SocialFeed._sc2Fonts=[
 {id:"inter",label:"Aa",weight:"800",family:"Inter, system-ui, -apple-system, sans-serif"},
 {id:"round",label:"Aa",weight:"700",family:'"Comic Sans MS","Chalkboard SE","Marker Felt","Segoe Print",cursive'},
 {id:"serif",label:"Aa",weight:"700",family:'Georgia,"Times New Roman",serif'},
 {id:"mono",label:"Aa",weight:"700",family:'"Courier New",ui-monospace,monospace'}
];
SocialFeed._sc2Colors=["#00d4ff","#8b5cf6","#fbbf24","#22c55e","#2dd4bf","#ffffff","#0a0e27"];
SocialFeed._sc2Emojis=["😀","😂","😍","🥳","😎","🤩","😭","😅","🔥","💜","💙","💛","💚","✨","⭐","🎉","🎊","🙌","👏","👍","🙏","💪","💯","❤️","💰","💵","🪙","🏆","🎁","🚀","📈","🤝","💡","🌟","🎯","👀","🫶","😇","🥰","🤑"];
SocialFeed._sc2Svgs=(function(){
 var g='<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00d4ff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>';
 return [
 {n:"LTD",svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>'+g+'</defs><circle cx="50" cy="50" r="46" fill="#fbbf24" stroke="#d69e00" stroke-width="4"/><circle cx="50" cy="50" r="37" fill="none" stroke="#fff8e1" stroke-width="2" opacity=".6"/><text x="50" y="62" font-family="Inter,sans-serif" font-size="30" font-weight="800" text-anchor="middle" fill="#7a5a00">LTD</text></svg>'},
 {n:"Tanda",svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>'+g+'</defs><circle cx="50" cy="50" r="34" fill="none" stroke="url(#g)" stroke-width="9" stroke-dasharray="14 9" stroke-linecap="round"/><path d="M50 8 l10 12 -20 0z" fill="#8b5cf6"/><circle cx="50" cy="50" r="10" fill="url(#g)"/></svg>'},
 {n:"Ahorra",svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70"><defs>'+g+'</defs><rect x="3" y="3" rx="33" ry="33" width="134" height="64" fill="url(#g)"/><text x="70" y="46" font-family="Inter,sans-serif" font-size="26" font-weight="800" text-anchor="middle" fill="#ffffff">¡Ahorra!</text></svg>'},
 {n:"Bolsa",svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>'+g+'</defs><path d="M22 34 h56 l-6 58 a6 6 0 0 1-6 6 H34 a6 6 0 0 1-6-6z" fill="url(#g)"/><path d="M34 40 v-8 a16 16 0 0 1 32 0 v8" fill="none" stroke="#0a0e27" stroke-width="6" stroke-linecap="round"/></svg>'},
 {n:"Fiesta",svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20 86 L54 46 74 66z" fill="#8b5cf6"/><path d="M20 86 L38 62 60 80z" fill="#00d4ff" opacity=".85"/><circle cx="72" cy="30" r="5" fill="#fbbf24"/><circle cx="86" cy="46" r="4" fill="#22c55e"/><circle cx="60" cy="20" r="4" fill="#00d4ff"/><rect x="80" y="16" width="6" height="6" fill="#8b5cf6" transform="rotate(20 83 19)"/></svg>'}
 ];
})();

SocialFeed._openStoryCreator=function(){SocialFeed._storyAudience="public";
 var ov=document.createElement("div");
 ov.className="story-creator-overlay";ov.id="storyCreatorOverlay";
 var fi=document.createElement("input");fi.type="file";fi.accept="image/*,video/*";fi.style.cssText="position:absolute;opacity:0;width:1px;height:1px;";
 ov.appendChild(fi);
 document.body.appendChild(ov);document.body.style.overflow="hidden";
 requestAnimationFrame(function(){ov.classList.add("active")});

 var selectedFile=null,mediaType="image";
 fi.addEventListener("change",function(e){
  var file=e.target.files[0];if(!file)return;
  selectedFile=file;mediaType=file.type.startsWith("video")?"video":"image";
  var url=URL.createObjectURL(file);
  if(mediaType==="video"){SocialFeed._sc2VideoUI(ov,url,selectedFile)}
  else{SocialFeed._sc2Editor(ov,url,selectedFile)}
 });
 fi.addEventListener("cancel",function(){SocialFeed._closeCreator()});
 setTimeout(function(){fi.click()},100);
};

/* Video path: keep the original simple preview + raw upload (no editor). */
SocialFeed._sc2VideoUI=function(ov,url,file){
 ov.insertAdjacentHTML("beforeend",'<div class="sc-preview-container" id="scPreview"><button class="sc-close" id="scClose"><i class="fas fa-times"></i></button><video src="'+url+'" controls playsinline autoplay muted style="width:100%;max-height:60vh;object-fit:contain"></video></div><div class="sc-controls" id="scControls" style="display:flex"><textarea class="sc-caption-input" id="scCaption" placeholder="Agregar un texto... (opcional)" maxlength="200" rows="2"></textarea><button class="sc-publish-btn" id="scPublish">Publicar Historia</button><span class="sc-expire-hint"><i class="fas fa-clock"></i> Desaparece en 24 horas</span></div>');
 document.getElementById("scClose").addEventListener("click",function(){SocialFeed._closeCreator()});(function(){var _cfc=document.getElementById("scControls"),_pb=document.getElementById("scPublish");if(_cfc&&_pb){_cfc.insertBefore(SocialFeed._cfBuildAudienceBar(),_pb);}})();
 document.getElementById("scPublish").addEventListener("click",function(){
  var cap=(document.getElementById("scCaption")||{}).value||"";
  SocialFeed._sc2Publish(this,file,"video",cap);
 });
};

/* Image editor with draggable text + sticker layers. */
SocialFeed._sc2Editor=function(ov,url,file){
 ov.classList.add("ltc-sc2-root");
 ov.innerHTML='<div class="ltc-sc2-editor">'+
  '<div class="ltc-sc2-top">'+
   '<button class="ltc-sc2-back" id="sc2Back" aria-label="Cancelar"><i class="fas fa-arrow-left"></i></button>'+
   '<div class="ltc-sc2-tools">'+
    '<button class="ltc-sc2-tool" id="sc2ToolText" aria-label="Texto"><span style="font-weight:800">Aa</span></button>'+
    '<button class="ltc-sc2-tool" id="sc2ToolStk" aria-label="Stickers">😊</button>'+
   '</div>'+
  '</div>'+
  '<div class="ltc-sc2-stagewrap"><div class="ltc-sc2-stage" id="sc2Stage"><img class="ltc-sc2-img" id="sc2Img" alt=""></div></div>'+
  '<div class="ltc-sc2-bottom"><input class="ltc-sc2-caption" id="scCaption" placeholder="Agregar un texto... (opcional)" maxlength="200"><button class="ltc-sc2-publish" id="sc2Publish">Publicar</button></div>'+
  '<div class="ltc-sc2-textbar" id="sc2TextBar" hidden></div>'+
  '<div class="ltc-sc2-stkpanel" id="sc2StkPanel" hidden></div>'+
 '</div>';
 var img=document.getElementById("sc2Img");
 img.src=url;
 var stage=document.getElementById("sc2Stage");
 img.onload=function(){
  // Fit the stage box to the image aspect ratio inside the available viewport.
  var wrap=stage.parentElement;var availW=wrap.clientWidth,availH=wrap.clientHeight;
  var ar=img.naturalWidth/img.naturalHeight;var w=availW,h=w/ar;
  if(h>availH){h=availH;w=h*ar;}
  stage.style.width=w+"px";stage.style.height=h+"px";
 };
 // Build the sticker palette + text controls once.
 SocialFeed._sc2BuildTextBar(document.getElementById("sc2TextBar"));
 SocialFeed._sc2BuildStkPanel(document.getElementById("sc2StkPanel"),stage);
 document.getElementById("sc2Back").addEventListener("click",function(){SocialFeed._closeCreator()});
 document.getElementById("sc2ToolText").addEventListener("click",function(){SocialFeed._sc2AddText(stage)});
 document.getElementById("sc2ToolStk").addEventListener("click",function(){var p=document.getElementById("sc2StkPanel");p.hidden=!p.hidden;});
 // Tapping empty stage deselects.
 stage.addEventListener("pointerdown",function(e){if(e.target===stage||e.target===img){SocialFeed._sc2Select(null,stage);}});
 (function(){var _cfb=ov.querySelector(".ltc-sc2-bottom");if(_cfb&&_cfb.parentNode){_cfb.parentNode.insertBefore(SocialFeed._cfBuildAudienceBar(),_cfb);}})();document.getElementById("sc2Publish").addEventListener("click",function(){
  var self=this;var cap=(document.getElementById("scCaption")||{}).value||"";
  self.disabled=true;self.textContent="Publicando...";
  SocialFeed._sc2Select(null,stage);
  SocialFeed._sc2Flatten(img,stage).then(function(blob){
   if(!blob){throw new Error("flatten failed");}
   var f=new File([blob],"story.jpg",{type:"image/jpeg"});
   SocialFeed._sc2Publish(self,f,"image",cap);
  }).catch(function(){self.disabled=false;self.textContent="Publicar";if(window.LaTandaPopup)window.LaTandaPopup.showError("Error al procesar la imagen");});
 });
};

/* Shared upload → create-story path (identical to the legacy creator). */
SocialFeed._sc2Publish=function(btn,file,mediaType,caption){
 btn.disabled=true;if(btn.textContent.indexOf("...")<0)btn.textContent="Publicando...";
 var fd=new FormData();fd.append("file",file);
 var tk=localStorage.getItem("auth_token")||localStorage.getItem("authToken");
 var uploadUrl=mediaType==="video"?"/api/upload/social-video":"/api/upload/social-image";
 var label=mediaType==="video"?"Publicar Historia":"Publicar";
 fetch(uploadUrl,{method:"POST",headers:{Authorization:"Bearer "+tk},body:fd})
 .then(function(r){return r.json()})
 .then(function(d){
  var url=(d.data&&d.data.url)||d.url;if(!url)throw new Error("Upload failed");
  return fetch("/api/stories",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tk},body:JSON.stringify({media_url:url,media_type:mediaType,caption:caption,audience:(SocialFeed._storyAudience||"public")})});
 })
 .then(function(r){return r.json()})
 .then(function(d){
  if(d.success){SocialFeed._closeCreator();SocialFeed.loadStories();if(window.LaTandaPopup)window.LaTandaPopup.showSuccess("Historia publicada");}
  else{btn.disabled=false;btn.textContent=label;if(window.LaTandaPopup)window.LaTandaPopup.showError("Error al publicar");}
 })
 .catch(function(){btn.disabled=false;btn.textContent=label;if(window.LaTandaPopup)window.LaTandaPopup.showError("Error al subir archivo");});
};


/* ══════ CLOSE-FRIENDS (amigos cercanos) ══════
   El FILTRADO de privacidad lo hace el BACKEND. Acá solo: toggle de audiencia en
   el creador (incluye `audience` en el POST /api/stories), gestión (modal con
   GET/POST/DELETE /api/close-friends[/candidates]) y el marcador graceful de la
   burbuja (si la historia no trae `audience`, no hay badge). */
SocialFeed._storyAudience="public";
SocialFeed._cfIsGroup=function(g){try{return !!(g&&g.stories&&g.stories.some(function(s){return s&&s.audience==="close_friends"}))}catch(e){return false}};
SocialFeed._cfBuildAudienceBar=function(){
 SocialFeed._cfInjectCss();
 var cur=SocialFeed._storyAudience||"public";
 var wrap=document.createElement("div");
 wrap.className="ltc-cf-audbar";
 wrap.innerHTML='<div class="ltc-cf-seg" role="group" aria-label="Audiencia de la historia">'+
  '<button type="button" class="ltc-cf-segb'+(cur==="public"?" on":"")+'" data-aud="public"><i class="fas fa-globe"></i> Público</button>'+
  '<button type="button" class="ltc-cf-segb'+(cur==="close_friends"?" on":"")+'" data-aud="close_friends"><i class="fas fa-star"></i> Amigos cercanos</button>'+
  '</div>'+
  '<button type="button" class="ltc-cf-edit" aria-label="Editar amigos cercanos"><i class="fas fa-pen"></i> Editar amigos cercanos</button>';
 wrap.querySelectorAll(".ltc-cf-segb").forEach(function(b){
  b.addEventListener("click",function(){
   SocialFeed._storyAudience=b.getAttribute("data-aud");
   wrap.querySelectorAll(".ltc-cf-segb").forEach(function(x){x.classList.toggle("on",x===b)});
  });
 });
 wrap.querySelector(".ltc-cf-edit").addEventListener("click",function(){SocialFeed._openCloseFriends()});
 return wrap;
};
SocialFeed._openCloseFriends=function(){
 SocialFeed._cfInjectCss();
 var esc=function(s){return SocialFeed.escapeHtml(String(s==null?"":s))};
 var tk=localStorage.getItem("auth_token")||localStorage.getItem("authToken");
 var hdr=tk?{Authorization:"Bearer "+tk}:{};
 var ex=document.getElementById("ltcCfModal");if(ex)ex.remove();
 var ov=document.createElement("div");
 ov.className="ltc-cf-ov";ov.id="ltcCfModal";
 ov.innerHTML='<div class="ltc-cf-card" role="dialog" aria-modal="true" aria-label="Amigos cercanos">'+
  '<div class="ltc-cf-head"><h3>Amigos cercanos</h3><button class="ltc-cf-x" type="button" aria-label="Cerrar"><i class="fas fa-times"></i></button></div>'+
  '<p class="ltc-cf-hint">Solo tus amigos cercanos ven las historias que publiques para ellos. Nadie sabe que esta en tu lista.</p>'+
  '<div class="ltc-cf-status" id="cfStatus" role="status" aria-live="polite" hidden></div>'+
  '<div class="ltc-cf-sec"><div class="ltc-cf-sec-t">Tu lista</div><div class="ltc-cf-list" id="cfList"><div class="ltc-cf-load">Cargando...</div></div></div>'+
  '<div class="ltc-cf-sec"><div class="ltc-cf-sec-t">Agregar (personas que seguis)</div><div class="ltc-cf-list" id="cfCand"><div class="ltc-cf-load">Cargando...</div></div></div>'+
  '</div>';
 document.body.appendChild(ov);
 requestAnimationFrame(function(){ov.classList.add("active")});
 var close=function(){ov.classList.remove("active");setTimeout(function(){if(ov&&ov.parentNode)ov.remove()},200)};
 ov.querySelector(".ltc-cf-x").addEventListener("click",close);
 ov.addEventListener("click",function(e){if(e.target===ov)close()});
 /* CF-PULIDO FIX2(a): feedback INLINE dentro del modal. El LaTandaPopup global (z~10000)
    queda DETRAS del overlay .ltc-cf-ov (z-index 100060) -> el usuario no veia
    "Agregado/Quitado/error". Esta linea de estado vive en la tarjeta y se ve siempre. */
 var _cfStatusTimer=null;
 function cfSay(msg,isError){
  var el=document.getElementById("cfStatus");if(!el)return;
  el.textContent=msg;el.classList.toggle("is-err",!!isError);el.hidden=false;
  if(_cfStatusTimer)clearTimeout(_cfStatusTimer);
  _cfStatusTimer=setTimeout(function(){var e2=document.getElementById("cfStatus");if(e2)e2.hidden=true;},isError?5000:2600);
 }
 function row(u,inList){
  var name=u.name||u.handle||"Usuario";
  var sub=u.handle?("@"+u.handle):"";
  var av=(u.avatar_url||u.avatar);
  var avInner=av?'<img src="'+esc(av)+'" alt="">':esc((String(name).trim()[0]||"U").toUpperCase());
  return '<div class="ltc-cf-row" data-uid="'+esc(u.user_id||u.id)+'">'+
   '<span class="ltc-cf-av">'+avInner+'</span>'+
   '<span class="ltc-cf-meta"><b>'+esc(name)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+
   (inList?'<button class="ltc-cf-btn rm" type="button" data-act="rm">Quitar</button>':'<button class="ltc-cf-btn add" type="button" data-act="add">Agregar</button>')+
   '</div>';
 }
 function fill(id,arr,inList,emptyMsg){
  var el=document.getElementById(id);if(!el)return;
  if(!Array.isArray(arr))arr=[];
  el.innerHTML=arr.length?arr.map(function(u){return row(u,inList)}).join(""):'<div class="ltc-cf-empty">'+emptyMsg+'</div>';
 }
 function loadList(){
  fetch("/api/close-friends",{headers:hdr}).then(function(r){return r.json()}).then(function(d){
   fill("cfList",(d&&(d.data||d))||[],true,"Todavia no agregaste a nadie.");
  }).catch(function(){var el=document.getElementById("cfList");if(el)el.innerHTML='<div class="ltc-cf-empty">No se pudo cargar.</div>'});
 }
 function loadCand(){
  fetch("/api/close-friends/candidates",{headers:hdr}).then(function(r){return r.json()}).then(function(d){
   fill("cfCand",(d&&(d.data||d))||[],false,"No hay a quien agregar. Segui a mas personas primero.");
  }).catch(function(){var el=document.getElementById("cfCand");if(el)el.innerHTML='<div class="ltc-cf-empty">No se pudo cargar.</div>'});
 }
 ov.addEventListener("click",function(e){
  var b=e.target&&e.target.closest?e.target.closest(".ltc-cf-btn"):null;if(!b)return;
  var rowEl=b.closest(".ltc-cf-row");if(!rowEl)return;
  var uid=rowEl.getAttribute("data-uid");var act=b.getAttribute("data-act");
  if(!uid)return;
  b.disabled=true;
  var method=act==="add"?"POST":"DELETE";
  fetch("/api/close-friends/"+encodeURIComponent(uid),{method:method,headers:hdr}).then(function(r){
   return r.json().catch(function(){return{}}).then(function(j){return{ok:r.ok,status:r.status,j:j}});
  }).then(function(res){
   if(res.ok&&res.j.success!==false){
    cfSay(act==="add"?"Agregado a amigos cercanos":"Quitado de amigos cercanos",false);
    loadList();loadCand();
   }else{
    b.disabled=false;
    /* CF-PULIDO FIX2(b): el 400 real llega como {success:false,data:{error:{message}}}.
       El codigo viejo leia res.j.error.message (no existe ahi) -> mensaje generico.
       Leemos data.error.message PRIMERO, con fallbacks. */
    var msg=(res.j&&res.j.data&&res.j.data.error&&res.j.data.error.message)||(res.j&&res.j.error&&res.j.error.message)||(res.j&&res.j.message)||(res.status===400?"Solo podes agregar a personas que seguis.":"No se pudo completar la accion.");
    cfSay(msg,true);
   }
  }).catch(function(){b.disabled=false;cfSay("Error de red. Intenta de nuevo.",true)});
 });
 loadList();loadCand();
};
SocialFeed._cfInjectCss=function(){
 if(document.getElementById("ltc-cf-css"))return;
 var st=document.createElement("style");st.id="ltc-cf-css";
 st.textContent=".ltc-cf-audbar{position:relative;z-index:7;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;margin:0 0 2px}"+
  ".ltc-cf-seg{display:inline-flex;background:rgba(10,14,39,.6);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:3px;gap:2px}"+
  ".ltc-cf-segb{appearance:none;-webkit-appearance:none;border:0;background:transparent;color:rgba(255,255,255,.72);font:inherit;font-size:.78rem;font-weight:700;padding:7px 13px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:background .15s,color .15s}"+
  ".ltc-cf-segb i{font-size:.72rem}"+
  ".ltc-cf-segb.on[data-aud=public]{background:linear-gradient(135deg,#00d4ff,#8b5cf6);color:#061029}"+
  ".ltc-cf-segb.on[data-aud=close_friends]{background:linear-gradient(135deg,#22d55e,#16a34a);color:#04210f}"+
  ".ltc-cf-segb:focus-visible{outline:2px solid #00d4ff;outline-offset:2px}"+
  ".ltc-cf-edit{appearance:none;-webkit-appearance:none;border:0;background:transparent;color:#22d55e;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 4px}"+
  ".ltc-cf-edit:focus-visible{outline:2px solid #22d55e;outline-offset:2px}"+
  ".ltc-cf-ov{position:fixed;inset:0;z-index:100060;display:flex;align-items:flex-end;justify-content:center;background:rgba(4,8,26,.72);opacity:0;transition:opacity .2s}"+
  ".ltc-cf-ov.active{opacity:1}"+
  ".ltc-cf-card{width:100%;max-width:460px;max-height:86vh;display:flex;flex-direction:column;background:#0f1430;border:1px solid rgba(255,255,255,.12);border-radius:20px 20px 0 0;box-shadow:0 -20px 60px -20px rgba(0,0,0,.8);transform:translateY(16px);transition:transform .2s;overflow:hidden}"+
  ".ltc-cf-ov.active .ltc-cf-card{transform:none}"+
  "@media(min-width:620px){.ltc-cf-ov{align-items:center}.ltc-cf-card{border-radius:20px}}"+
  ".ltc-cf-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 6px}"+
  ".ltc-cf-head h3{margin:0;font-size:1.05rem;color:#fff;font-weight:800}"+
  ".ltc-cf-x{appearance:none;-webkit-appearance:none;border:0;background:rgba(255,255,255,.08);color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:.9rem}"+
  ".ltc-cf-hint{margin:0 18px 10px;font-size:.78rem;line-height:1.4;color:rgba(255,255,255,.6)}"+
  ".ltc-cf-status{margin:0 18px 10px;padding:9px 12px;border-radius:12px;font-size:.8rem;font-weight:600;line-height:1.35;background:rgba(34,213,94,.14);border:1px solid rgba(34,213,94,.4);color:#8af0b2}"+
  ".ltc-cf-status.is-err{background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.45);color:#fda4a4}"+
  ".ltc-cf-status[hidden]{display:none}"+
  ".ltc-cf-sec{padding:4px 0;overflow-y:auto}"+
  ".ltc-cf-sec-t{font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.45);padding:8px 18px 4px}"+
  ".ltc-cf-list{display:flex;flex-direction:column}"+
  ".ltc-cf-row{display:flex;align-items:center;gap:12px;padding:9px 18px}"+
  ".ltc-cf-av{width:40px;height:40px;border-radius:50%;overflow:hidden;flex:none;display:grid;place-items:center;background:linear-gradient(160deg,#1c2346,#10152e);color:#fff;font-weight:800;font-size:.9rem}"+
  ".ltc-cf-av img{width:100%;height:100%;object-fit:cover}"+
  ".ltc-cf-meta{flex:1;min-width:0;display:flex;flex-direction:column}"+
  ".ltc-cf-meta b{color:#fff;font-size:.88rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".ltc-cf-meta small{color:rgba(255,255,255,.5);font-size:.74rem}"+
  ".ltc-cf-btn{appearance:none;-webkit-appearance:none;border:0;border-radius:999px;font:inherit;font-size:.78rem;font-weight:700;padding:7px 15px;cursor:pointer;flex:none}"+
  ".ltc-cf-btn.add{background:linear-gradient(135deg,#22d55e,#16a34a);color:#04210f}"+
  ".ltc-cf-btn.rm{background:rgba(255,255,255,.1);color:rgba(255,255,255,.85)}"+
  ".ltc-cf-btn:disabled{opacity:.5;cursor:default}"+
  ".ltc-cf-empty,.ltc-cf-load{padding:14px 18px;color:rgba(255,255,255,.5);font-size:.82rem}"+
  ".hdc-cstory.is-cf::before{background:linear-gradient(135deg,#22d55e,#16a34a)!important}"+
  ".hdc-cstory-cf{position:absolute;top:8px;right:8px;z-index:4;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#22d55e,#16a34a);display:grid;place-items:center;color:#04210f;font-size:.62rem;border:2px solid #0f1430;box-shadow:0 2px 6px rgba(0,0,0,.4)}"+
  ".ltc-st3d-cf .ltc-st3d-name::after{content:' ★';color:#22d55e}"+
  /* CF-PULIDO FIX3(b): etiqueta "Amigos cercanos" en el visor de historias (la ve el autor
     y el espectador autorizado). Encima del media, debajo del header. */
  ".ltc-sv-cf{display:inline-flex;align-items:center;gap:5px;align-self:flex-start;margin:6px 0 0 14px;padding:3px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:rgba(34,213,94,.18);border:1px solid rgba(34,213,94,.5);color:#8af0b2;z-index:6;position:relative}"+
  ".ltc-sv-cf i{font-size:.6rem}";
 (document.head||document.documentElement).appendChild(st);
};
try{if(document.head||document.body)SocialFeed._cfInjectCss();}catch(e){}

/* ── layer selection + drag (transform-based) ── */
SocialFeed._sc2Select=function(el,stage){
 stage=stage||document.getElementById("sc2Stage");if(!stage)return;
 var all=stage.querySelectorAll(".ltc-sc2-layer");for(var i=0;i<all.length;i++)all[i].classList.remove("sel");
 SocialFeed._sc2Sel=el||null;
 var tb=document.getElementById("sc2TextBar");
 if(el){el.classList.add("sel");if(tb)tb.hidden=(el.dataset.kind!=="text");}
 else if(tb)tb.hidden=true;
};
SocialFeed._sc2Apply=function(el){el.style.transform="translate(-50%,-50%) translate("+el._tx+"px,"+el._ty+"px)";};
SocialFeed._sc2Drag=function(el,stage){
 el._tx=el._tx||0;el._ty=el._ty||0;SocialFeed._sc2Apply(el);
 var sx,sy,ox,oy,active=false,lastTap=0;
 el.addEventListener("pointerdown",function(e){
  if(el._editing)return;
  if(e.target.classList.contains("ltc-sc2-handle")||e.target.classList.contains("ltc-sc2-del"))return;
  active=true;try{el.setPointerCapture(e.pointerId);}catch(x){}
  sx=e.clientX;sy=e.clientY;ox=el._tx;oy=el._ty;
  SocialFeed._sc2Select(el,stage);
  var now=Date.now();
  if(el.dataset.kind==="text"&&now-lastTap<320){SocialFeed._sc2EditText(el);}
  lastTap=now;e.preventDefault();
 });
 el.addEventListener("pointermove",function(e){if(!active||el._editing)return;el._tx=ox+(e.clientX-sx);el._ty=oy+(e.clientY-sy);SocialFeed._sc2Apply(el);});
 function end(){active=false;}
 el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
};
/* Corner handle → proportional resize (font-size for text/emoji, width for svg). */
SocialFeed._sc2Resize=function(el,handle,getS,setS){
 var startDist,base,rz=false,cx,cy;
 handle.addEventListener("pointerdown",function(e){
  e.stopPropagation();rz=true;try{handle.setPointerCapture(e.pointerId);}catch(x){}
  var r=el.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;
  startDist=Math.hypot(e.clientX-cx,e.clientY-cy)||1;base=getS();e.preventDefault();
 });
 handle.addEventListener("pointermove",function(e){if(!rz)return;var d=Math.hypot(e.clientX-cx,e.clientY-cy);var s=base*(d/startDist);setS(Math.max(10,Math.min(400,s)));e.preventDefault();});
 function end(){rz=false;}
 handle.addEventListener("pointerup",end);handle.addEventListener("pointercancel",end);
};
SocialFeed._sc2Handles=function(el){
 var del=document.createElement("button");del.className="ltc-sc2-del";del.innerHTML='<i class="fas fa-times"></i>';
 del.addEventListener("pointerdown",function(e){e.stopPropagation();});
 del.addEventListener("click",function(e){e.stopPropagation();var s=document.getElementById("sc2Stage");el.remove();SocialFeed._sc2Select(null,s);});
 var h=document.createElement("div");h.className="ltc-sc2-handle";
 el.appendChild(del);el.appendChild(h);return h;
};

/* ── TEXT layer ── */
SocialFeed._sc2AddText=function(stage){
 var el=document.createElement("div");el.className="ltc-sc2-layer ltc-sc2-text";el.dataset.kind="text";
 el.dataset.font="inter";el.dataset.color="#ffffff";el.dataset.size="34";el.dataset.bg="0";
 var f=SocialFeed._sc2Fonts[0];
 el.style.cssText="left:50%;top:38%;font-family:"+f.family+";font-weight:"+f.weight+";font-size:34px;color:#ffffff;";
 el.textContent="Tu texto";
 stage.appendChild(el);
 SocialFeed._sc2Handles(el);
 var h=el.querySelector(".ltc-sc2-handle");
 SocialFeed._sc2Resize(el,h,function(){return parseFloat(el.style.fontSize);},function(s){el.style.fontSize=s+"px";el.dataset.size=s;});
 SocialFeed._sc2Drag(el,stage);
 el.addEventListener("blur",function(){el._editing=false;el.contentEditable="false";el.classList.remove("editing");if(!el.textContent.trim())el.textContent="Tu texto";});
 SocialFeed._sc2Select(el,stage);
 SocialFeed._sc2EditText(el);
};
SocialFeed._sc2EditText=function(el){
 el._editing=true;el.contentEditable="true";el.classList.add("editing");el.focus();
 try{var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(x){}
};
SocialFeed._sc2BuildTextBar=function(bar){
 var html="";
 html+='<div class="ltc-sc2-tb-row" id="sc2Fonts">';
 SocialFeed._sc2Fonts.forEach(function(f){html+='<button class="ltc-sc2-fbtn" data-font="'+f.id+'" style="font-family:'+f.family+';font-weight:'+f.weight+'">Aa</button>';});
 html+='</div>';
 html+='<div class="ltc-sc2-tb-row"><div class="ltc-sc2-sizes"><button data-size="22">S</button><button data-size="34">M</button><button data-size="52">L</button></div>'+
  '<button class="ltc-sc2-bgtog" id="sc2Bg" aria-label="Fondo"><i class="fas fa-highlighter"></i></button>'+
  '<div class="ltc-sc2-swatches" id="sc2Sw"></div></div>';
 bar.innerHTML=html;
 var sw=bar.querySelector("#sc2Sw");
 SocialFeed._sc2Colors.forEach(function(c){var b=document.createElement("button");b.className="ltc-sc2-sw";b.style.background=c;b.dataset.color=c;sw.appendChild(b);});
 function cur(){return SocialFeed._sc2Sel&&SocialFeed._sc2Sel.dataset.kind==="text"?SocialFeed._sc2Sel:null;}
 bar.querySelectorAll(".ltc-sc2-fbtn").forEach(function(b){b.addEventListener("click",function(){var el=cur();if(!el)return;var f=SocialFeed._sc2Fonts.filter(function(x){return x.id===b.dataset.font;})[0];el.style.fontFamily=f.family;el.style.fontWeight=f.weight;el.dataset.font=f.id;});});
 bar.querySelectorAll(".ltc-sc2-sizes button").forEach(function(b){b.addEventListener("click",function(){var el=cur();if(!el)return;el.style.fontSize=b.dataset.size+"px";el.dataset.size=b.dataset.size;});});
 bar.querySelectorAll(".ltc-sc2-sw").forEach(function(b){b.addEventListener("click",function(){var el=cur();if(!el)return;el.style.color=b.dataset.color;el.dataset.color=b.dataset.color;});});
 bar.querySelector("#sc2Bg").addEventListener("click",function(){var el=cur();if(!el)return;var on=el.dataset.bg==="1";el.dataset.bg=on?"0":"1";el.classList.toggle("hasbg",!on);});
};

/* ── STICKER layers ── */
SocialFeed._sc2BuildStkPanel=function(panel,stage){
 panel.innerHTML='<div class="ltc-sc2-stktitle"><span translate="no">La Tanda</span></div>'+
  '<div class="ltc-sc2-stkgrid" id="sc2LtGrid"></div>'+
  '<div class="ltc-sc2-stktitle">Emojis</div>'+
  '<div class="ltc-sc2-stkgrid" id="sc2EmoGrid"></div>';
 var lt=panel.querySelector("#sc2LtGrid");
 SocialFeed._sc2Svgs.forEach(function(s){var b=document.createElement("button");b.className="ltc-sc2-stkbtn";var uri="data:image/svg+xml,"+encodeURIComponent(s.svg);b.innerHTML='<img src="'+uri+'" alt="'+s.n+'">';b.addEventListener("click",function(){SocialFeed._sc2AddSvg(stage,uri);panel.hidden=true;});lt.appendChild(b);});
 var eg=panel.querySelector("#sc2EmoGrid");
 SocialFeed._sc2Emojis.forEach(function(em){var b=document.createElement("button");b.className="ltc-sc2-stkbtn emo";b.textContent=em;b.addEventListener("click",function(){SocialFeed._sc2AddEmoji(stage,em);panel.hidden=true;});eg.appendChild(b);});
};
SocialFeed._sc2AddEmoji=function(stage,em){
 var el=document.createElement("div");el.className="ltc-sc2-layer ltc-sc2-emoji";el.dataset.kind="emoji";
 el.style.cssText="left:50%;top:50%;font-size:72px;line-height:1;";el.textContent=em;
 stage.appendChild(el);
 var h=SocialFeed._sc2Handles(el);
 SocialFeed._sc2Resize(el,h,function(){return parseFloat(el.style.fontSize);},function(s){el.style.fontSize=s+"px";});
 SocialFeed._sc2Drag(el,stage);SocialFeed._sc2Select(el,stage);
};
SocialFeed._sc2AddSvg=function(stage,uri){
 var el=document.createElement("div");el.className="ltc-sc2-layer ltc-sc2-svg";el.dataset.kind="svg";
 el.style.cssText="left:50%;top:50%;width:110px;";
 var im=document.createElement("img");im.src=uri;im.draggable=false;im.style.cssText="width:100%;display:block;pointer-events:none;";
 el._imgEl=im;el.appendChild(im);
 stage.appendChild(el);
 var h=SocialFeed._sc2Handles(el);
 SocialFeed._sc2Resize(el,h,function(){return parseFloat(el.style.width);},function(s){el.style.width=s+"px";});
 SocialFeed._sc2Drag(el,stage);SocialFeed._sc2Select(el,stage);
};

/* ── FLATTEN: composite image + layers to a JPEG blob at natural resolution ── */
SocialFeed._sc2Flatten=function(img,stage){
 return new Promise(function(res){
  var cv=document.createElement("canvas");cv.width=img.naturalWidth;cv.height=img.naturalHeight;
  var ctx=cv.getContext("2d");ctx.drawImage(img,0,0,cv.width,cv.height);
  var sR=stage.getBoundingClientRect();var sc=cv.width/sR.width;
  function rr(x,y,w,h,r){r=Math.min(r,h/2,w/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  var layers=stage.querySelectorAll(".ltc-sc2-layer");
  layers.forEach(function(el){
   var r=el.getBoundingClientRect();
   var x=(r.left-sR.left)*sc,y=(r.top-sR.top)*sc,w=r.width*sc,h=r.height*sc;
   var k=el.dataset.kind;
   if(k==="svg"){try{ctx.drawImage(el._imgEl,x,y,w,h);}catch(e){}return;}
   if(k==="emoji"){var fs=parseFloat(el.style.fontSize)*sc;ctx.font=fs+'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#000";ctx.fillText(el.textContent,x+w/2,y+h/2);return;}
   if(k==="text"){
    var cs=getComputedStyle(el);var fsz=parseFloat(cs.fontSize)*sc;
    ctx.font=cs.fontWeight+" "+fsz+'px '+cs.fontFamily;
    if(el.dataset.bg==="1"){ctx.fillStyle="rgba(10,14,39,.72)";rr(x,y,w,h,h*0.28);ctx.fill();}
    ctx.fillStyle=el.dataset.color||"#fff";ctx.textAlign="left";ctx.textBaseline="top";
    if(el.dataset.bg!=="1"){ctx.shadowColor="rgba(0,0,0,.55)";ctx.shadowBlur=fsz*0.18;ctx.shadowOffsetY=fsz*0.04;}
    var padX=parseFloat(cs.paddingLeft)*sc,padY=parseFloat(cs.paddingTop)*sc;
    var lh=fsz*1.25;var lines=el.innerText.split("\n");
    lines.forEach(function(ln,i){ctx.fillText(ln,x+padX,y+padY+i*lh);});
    ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
   }
  });
  cv.toBlob(function(b){res(b);},"image/jpeg",0.85);
 });
};

SocialFeed._closeCreator=function(){
 var ov=document.getElementById("storyCreatorOverlay");
 if(ov){ov.classList.remove("active");setTimeout(function(){ov.remove();document.body.style.overflow=""},250)}
};

/* Stories swipe + keyboard */
(function(){
 var sx=0,dx=0;
 var IGN=".sv-reply-bar,.ltc-sv1-sheet,.ltc-sv1-sheet-back,.ltc-sv1-toast";
 document.addEventListener("touchstart",function(e){var o=document.getElementById("storyViewerOverlay");if(!o||e.target.closest(IGN))return;sx=e.touches[0].clientX;dx=0},{passive:true});
 document.addEventListener("touchmove",function(e){var o=document.getElementById("storyViewerOverlay");if(!o||e.target.closest(IGN))return;dx=e.touches[0].clientX-sx},{passive:true});
 document.addEventListener("touchend",function(e){var o=document.getElementById("storyViewerOverlay");if(!o||e.target.closest(IGN))return;if(Math.abs(dx)>60)SocialFeed._advStory(dx>0?-1:1);dx=0});
 document.addEventListener("keydown",function(e){var o=document.getElementById("storyViewerOverlay");if(!o)return;var sheetOpen=!!o.querySelector(".ltc-sv1-sheet");if(e.key==="Escape"){if(sheetOpen){SocialFeed._sv1CloseSheet();return}SocialFeed._closeViewer();return}if(sheetOpen||(e.target&&e.target.closest&&e.target.closest(".sv-reply-input")))return;if(e.key==="ArrowLeft")SocialFeed._advStory(-1);if(e.key==="ArrowRight")SocialFeed._advStory(1)});
})();

/* v4.25.17: Admin Pin/Unpin for social_feed
 * Adds 📌 indicator to pinned events and an admin-only Pin/Unpin button
 * in the post-menu dropdown. See INDIGOAZUL/latanda-fintech PR #84 for
 * backend endpoints + is_pinned ORDER BY surfacing.
 */
(function(){
 if(!window.SocialFeed||SocialFeed._adminPinBootstrapped)return;
 SocialFeed._adminPinBootstrapped=true;

 SocialFeed._uuidRegex=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

 SocialFeed._injectPinControls=function(){
  if(!this.container)return;
  var cards=this.container.querySelectorAll('[data-event-id]');
  for(var i=0;i<cards.length;i++){
   var card=cards[i];
   if(card.dataset.pinDecorated==='1')continue;
   var id=card.getAttribute('data-event-id');
   if(!id)continue;
   var ev=null;
   for(var j=0;j<this.events.length;j++){if(String(this.events[j].id)===String(id)){ev=this.events[j];break}}
   if(!ev)continue;
   var pinned=!!ev.is_pinned;
   // Badge on pinned cards (top-left, non-intrusive)
   if(pinned&&!card.querySelector('.sf-pinned-badge')){
    var badge=document.createElement('div');
    badge.className='sf-pinned-badge';
    badge.title='Publicacion fijada';
    badge.innerHTML='<i class="fas fa-thumbtack"></i> Fijado';
    card.appendChild(badge);
   }
   // Admin pin/unpin button in the dropdown (idempotent)
   if(window.__isAdminUser){
    var dropdown=card.querySelector('.post-menu-dropdown');
    if(dropdown&&!dropdown.querySelector('.post-menu-pintoggle')){
     var btn=document.createElement('button');
     btn.className='post-menu-pintoggle';
     btn.setAttribute('data-id',id);
     btn.setAttribute('data-pinned',pinned?'1':'0');
     btn.innerHTML=pinned?'<i class="fas fa-thumbtack" style="transform:rotate(45deg)"></i> Desfijar':'<i class="fas fa-thumbtack"></i> Fijar';
     dropdown.appendChild(btn);
    }
   }
   card.dataset.pinDecorated='1';
  }
 };

 SocialFeed._refreshAfterPin=function(){
  // After a pin/unpin, reload from offset 0 so the pinned card surfaces at top.
  this.offset=0;
  this.events=[];
  if(this.container){
   var feed=this.container.querySelector('.feed-events')||this.container;
   feed.querySelectorAll('[data-event-id]').forEach(function(n){n.remove()});
  }
  if(typeof this.loadFeed==='function'){this.loadFeed()}
  else if(typeof this.fetchFeed==='function'){this.fetchFeed()}
  else if(typeof this.refresh==='function'){this.refresh()}
 };

 SocialFeed.togglePinAdmin=async function(eventId,currentlyPinned){
  var token=localStorage.getItem("auth_token")||localStorage.getItem("authToken")||"";
  if(!token){
   if(window.LaTandaPopup&&window.LaTandaPopup.showError)window.LaTandaPopup.showError("Debes iniciar sesion como admin");
   return;
  }
  if(!SocialFeed._uuidRegex.test(String(eventId||""))){
   if(window.LaTandaPopup&&window.LaTandaPopup.showError)window.LaTandaPopup.showError("ID de evento invalido");
   return;
  }
  var url=currentlyPinned?"/api/admin/social/unpin":"/api/admin/social/pin";
  try{
   var res=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({event_id:eventId})
   });
   var data=null;
   try{data=await res.json()}catch(_){data=null}
   if(!res.ok||!data||data.success===false){
    var msg=(data&&(data.message||data.error))||("HTTP "+res.status+" "+res.statusText);
    if(window.LaTandaPopup&&window.LaTandaPopup.showError)window.LaTandaPopup.showError("No se pudo "+(currentlyPinned?"desfijar":"fijar")+": "+msg);
    else if(typeof console!=='undefined')console.error("[SocialFeed.togglePin]",msg);
    return;
   }
   if(window.LaTandaPopup&&window.LaTandaPopup.showSuccess)window.LaTandaPopup.showSuccess(currentlyPinned?"Publicacion desfijada":"Publicacion fijada");
   SocialFeed._refreshAfterPin();
  }catch(err){
   var em=(err&&err.message)?err.message:"Network error";
   if(window.LaTandaPopup&&window.LaTandaPopup.showError)window.LaTandaPopup.showError("Error de red: "+em);
   else if(typeof console!=='undefined')console.error("[SocialFeed.togglePin]",err);
  }
 };

 // Wrap renderEvents to inject controls after every DOM render
 var _orig=SocialFeed.renderEvents;
 if(typeof _orig==='function'){
  SocialFeed.renderEvents=function(){
   var ret=_orig.apply(this,arguments);
   try{this._injectPinControls()}catch(e){if(typeof console!=='undefined')console.error("[SocialFeed.pin] inject failed",e)}
   return ret;
  };
 }

 // Delegated click handler for the new button (capture at document so it works regardless of container re-render)
 document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('.post-menu-pintoggle');
  if(!t)return;
  e.preventDefault();
  e.stopPropagation();
  // close any open dropdowns
  document.querySelectorAll('.post-menu-dropdown.show').forEach(function(d){d.classList.remove('show')});
  var id=t.getAttribute('data-id');
  var pinned=t.getAttribute('data-pinned')==='1';
  SocialFeed.togglePinAdmin(id,pinned);
 },true);

 // If the feed was rendered before this script ran, decorate immediately
 try{if(SocialFeed.events&&SocialFeed.events.length)SocialFeed._injectPinControls()}catch(_){}
})();


// ============================================================
// STORIES MODERATION REPORT BUTTON (2026-05-26)
// Worker: StoriesModerationSurface | audit PR #36 P0 #2
// Adds a "Reportar" button to the story viewer for non-own stories
// and a modal that POSTs to /api/stories/:id/report.
// ============================================================
(function(){
  if(typeof SocialFeed==='undefined')return;

  // CSS injected once
  function _ensureStyles(){
    if(document.getElementById('story-report-styles'))return;
    var css = ''
      + '.sv-report-btn{background:transparent;border:none;color:rgba(255,255,255,0.85);font-size:18px;padding:6px 10px;margin-right:4px;cursor:pointer;border-radius:4px;}'
      + '.sv-report-btn:hover{background:rgba(255,255,255,0.12);color:#fff;}'
      + '.sr-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;}'
      + '.sr-modal{background:#121826;color:#e8eef7;border:1px solid rgba(255,255,255,0.08);border-radius:12px;max-width:480px;width:100%;padding:20px;box-shadow:0 12px 48px rgba(0,0,0,0.6);}'
      + '.sr-modal h3{margin:0 0 12px;font-size:18px;color:#00ffff;}'
      + '.sr-modal label{display:block;font-size:13px;margin:12px 0 6px;color:#a8b3c7;}'
      + '.sr-modal select,.sr-modal textarea{width:100%;background:#0c1220;color:#e8eef7;border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:8px 10px;font-size:14px;font-family:inherit;}'
      + '.sr-modal textarea{min-height:80px;resize:vertical;}'
      + '.sr-modal .sr-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;}'
      + '.sr-modal button{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-weight:600;font-size:14px;}'
      + '.sr-modal .sr-cancel{background:transparent;color:#a8b3c7;border:1px solid rgba(255,255,255,0.15);}'
      + '.sr-modal .sr-submit{background:#ef4444;color:#fff;}'
      + '.sr-modal .sr-submit:disabled{opacity:0.5;cursor:not-allowed;}'
      + '.sr-modal .sr-error{color:#fca5a5;font-size:13px;margin-top:8px;min-height:18px;}';
    var s = document.createElement('style');
    s.id = 'story-report-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  SocialFeed._openReportModal = function(storyId, authorName){
    _ensureStyles();
    var existing = document.getElementById('storyReportModal');
    if(existing) existing.remove();

    var bd = document.createElement('div');
    bd.className = 'sr-modal-backdrop';
    bd.id = 'storyReportModal';
    bd.innerHTML = ''
      + '<div class="sr-modal" role="dialog" aria-labelledby="srTitle">'
      + '  <h3 id="srTitle">Reportar historia</h3>'
      + '  <div style="font-size:13px;color:#a8b3c7;">Tu reporte ser&aacute; revisado por el equipo de moderaci&oacute;n.</div>'
      + '  <label for="srReason">Raz&oacute;n</label>'
      + '  <select id="srReason">'
      + '    <option value="">Selecciona una raz&oacute;n...</option>'
      + '    <option value="inappropriate">Contenido inapropiado</option>'
      + '    <option value="spam">Spam</option>'
      + '    <option value="harassment">Acoso</option>'
      + '    <option value="csam">Contenido de menores (CSAM)</option>'
      + '    <option value="misinformation">Desinformaci&oacute;n</option>'
      + '    <option value="other">Otro</option>'
      + '  </select>'
      + '  <label for="srNotes">Detalles (opcional, m&aacute;x 160)</label>'
      + '  <textarea id="srNotes" maxlength="160" placeholder="Cont&eacute;xto que ayude a moderaci&oacute;n..."></textarea>'
      + '  <div class="sr-error" id="srError"></div>'
      + '  <div class="sr-actions">'
      + '    <button type="button" class="sr-cancel" id="srCancel">Cancelar</button>'
      + '    <button type="button" class="sr-submit" id="srSubmit">Enviar reporte</button>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(bd);

    function close(){ bd.remove(); }
    bd.addEventListener('click', function(e){ if(e.target === bd) close(); });
    document.getElementById('srCancel').addEventListener('click', close);

    document.getElementById('srSubmit').addEventListener('click', function(){
      var reason = document.getElementById('srReason').value;
      var notes  = document.getElementById('srNotes').value.trim();
      var errEl  = document.getElementById('srError');
      errEl.textContent = '';
      if(!reason){ errEl.textContent = 'Selecciona una raz&oacute;n.'; return; }

      var btn = document.getElementById('srSubmit');
      btn.disabled = true; btn.textContent = 'Enviando...';

      var tk = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      if(!tk){
        errEl.textContent = 'Inicia sesión para reportar.';
        btn.disabled = false; btn.textContent = 'Enviar reporte';
        return;
      }

      fetch('/api/stories/' + encodeURIComponent(storyId) + '/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk },
        body: JSON.stringify({ reason: reason, additional_notes: notes })
      })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, status: r.status, body: j }; }).catch(function(){ return { ok: r.ok, status: r.status, body: null }; }); })
      .then(function(result){
        if(result.ok && result.body && (result.body.success || result.body.report_id)){
          close();
          if(window.LaTandaPopup && window.LaTandaPopup.showSuccess){
            window.LaTandaPopup.showSuccess('Reporte enviado. Revisaremos en breve.');
          } else {
            alert('Reporte enviado. Revisaremos en breve.');
          }
        } else {
          // Surface real HTTP status — never fake success per feedback_no_simulated_success_fallback
          var msg = (result.body && (result.body.message || result.body.error)) || ('HTTP ' + result.status);
          errEl.textContent = msg;
          btn.disabled = false; btn.textContent = 'Enviar reporte';
        }
      })
      .catch(function(err){
        errEl.textContent = (err && err.message) || 'Error de red al enviar reporte';
        btn.disabled = false; btn.textContent = 'Enviar reporte';
      });
    });
  };

  // Patch _renderStory to inject Reportar button next to the close X for non-own stories
  var _origRender = SocialFeed._renderStory;
  if(typeof _origRender === 'function'){
    SocialFeed._renderStory = function(){
      var ret = _origRender.apply(this, arguments);
      try{
        var ov = document.getElementById('storyViewerOverlay');
        if(!ov) return ret;
        var groups = SocialFeed._storiesData;
        var g = groups && groups[SocialFeed._currentUserIdx];
        if(!g || g.is_own) return ret; // no report button on own stories
        var story = g.stories[SocialFeed._currentStoryIdx];
        if(!story) return ret;
        if(ov.querySelector('.sv-report-btn')) return ret; // already injected
        var closeBtn = ov.querySelector('#svClose');
        if(!closeBtn) return ret;
        var rb = document.createElement('button');
        rb.className = 'sv-report-btn';
        rb.title = 'Reportar';
        rb.setAttribute('aria-label', 'Reportar historia');
        rb.innerHTML = '<i class="fas fa-flag"></i>';
        rb.addEventListener('click', function(e){
          e.stopPropagation();
          SocialFeed._openReportModal(story.id, (g.user && g.user.name) || '');
        });
        closeBtn.parentNode.insertBefore(rb, closeBtn);
      } catch(e){
        if(typeof console !== 'undefined') console.error('[SocialFeed.report] inject failed', e);
      }
      return ret;
    };
  }
})();

/* ════════ Stories v1 social tools (viewer) — ltc-sv1 ════════
 * Own story: 👁️ viewers affordance -> slide-up sheet (GET /api/stories/:id/viewers,
 * owner-only). Others: 6-emoji reaction row (POST /:id/react, upsert) + reply input
 * (POST /:id/reply {text} -> REAL DM; "Ver chat" deep-links mensajes.html?chat=<uid>).
 * Auto-advance pauses via SocialFeed._storyPaused while the sheet is open or the
 * reply input has focus. CSS: bloque ltc-sv1 en <style id="ltc-st3d-css">
 * (home-dashboard.html). */
SocialFeed._sv1Emojis=["❤️","\u{1F602}","\u{1F62E}","\u{1F622}","\u{1F44F}","\u{1F525}"];
SocialFeed._sv1Reduce=function(){try{return window.matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){return false}};
SocialFeed._sv1Tk=function(){return localStorage.getItem("auth_token")||localStorage.getItem("authToken")};
SocialFeed._sv1Ago=function(ts){try{var m=Math.floor((Date.now()-new Date(ts).getTime())/60000);if(m<1)return"ahora";if(m<60)return m+"m";if(m<1440)return Math.floor(m/60)+"h";return Math.floor(m/1440)+"d"}catch(e){return""}};
SocialFeed._sv1Err=function(r,d,fb){
 if(r&&r.status===404)return"La historia ya expiró";
 var m=d&&((d.data&&d.data.error&&d.data.error.message)||(d.error&&d.error.message)||d.message);
 return m||fb;
};
SocialFeed._sv1Toast=function(txt,actionLabel,actionFn,isErr){
 /* body-mounted (position:fixed) so it survives story advance/close — the
    "Ver chat" action must outlive the overlay */
 var ov=document.body;
 var old=document.querySelector(".ltc-sv1-toast");if(old)old.remove();
 var t=document.createElement("div");
 t.className="ltc-sv1-toast"+(isErr?" is-err":"");
 t.setAttribute("role","status");
 t.appendChild(document.createTextNode(txt));
 if(actionLabel&&actionFn){
  var b=document.createElement("button");b.type="button";b.textContent=actionLabel;
  b.addEventListener("click",actionFn);t.appendChild(b);
 }
 ov.appendChild(t);
 setTimeout(function(){if(t.isConnected)t.remove()},actionLabel?6000:3500);
};
SocialFeed._sv1Fly=function(em){
 var ov=document.getElementById("storyViewerOverlay");if(!ov)return;
 var c=ov.querySelector(".sv-content")||ov;
 var el=document.createElement("span");
 el.className="ltc-sv1-fly"+(SocialFeed._sv1Reduce()?" is-static":"");
 el.setAttribute("aria-hidden","true");el.textContent=em;
 c.appendChild(el);
 setTimeout(function(){el.remove()},1000);
};
SocialFeed._sv1Wire=function(story,isOwn){
 var ov=document.getElementById("storyViewerOverlay");if(!ov)return;
 if(isOwn){
  var vb=document.getElementById("sv1Views");
  if(vb)vb.addEventListener("click",function(e){e.stopPropagation();SocialFeed._sv1OpenViewers(story)});
  return;
 }
 ov.querySelectorAll(".ltc-sv1-emoji").forEach(function(btn){
  btn.addEventListener("click",function(e){
   e.stopPropagation();
   var em=btn.getAttribute("data-emoji");var t=SocialFeed._sv1Tk();if(!t||btn.disabled)return;
   btn.disabled=true;
   fetch("/api/stories/"+story.id+"/react",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({emoji:em})})
   .then(function(r){return r.json().then(function(d){return{r:r,d:d}}).catch(function(){return{r:r,d:null}})})
   .then(function(x){
    btn.disabled=false;
    if(x.r.ok&&x.d&&x.d.success){
     story._myReaction=em;
     ov.querySelectorAll(".ltc-sv1-emoji").forEach(function(b){b.classList.toggle("is-on",b===btn)});
     SocialFeed._sv1Fly(em);
    }else{SocialFeed._sv1Toast(SocialFeed._sv1Err(x.r,x.d,"No se pudo reaccionar"),null,null,true)}
   })
   .catch(function(){btn.disabled=false;SocialFeed._sv1Toast("Sin conexión — intenta de nuevo",null,null,true)});
  });
 });
 var inp=document.getElementById("svReplyInput"),send=document.getElementById("svReplySend");
 function doSend(){
  var msg=(inp?inp.value:"").trim();if(!msg)return;
  var t=SocialFeed._sv1Tk();if(!t||(send&&send.disabled))return;
  if(send)send.disabled=true;
  fetch("/api/stories/"+story.id+"/reply",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({text:msg})})
  .then(function(r){return r.json().then(function(d){return{r:r,d:d}}).catch(function(){return{r:r,d:null}})})
  .then(function(x){
   if(send)send.disabled=false;
   if(x.r.ok&&x.d&&x.d.success){
    if(inp){inp.value="";inp.blur()}
    SocialFeed._storyPaused=false;
    var cu=x.d.data&&x.d.data.conversation_user_id;
    SocialFeed._sv1Toast("Enviado ✓",cu?"Ver chat":null,cu?function(){window.location.href="mensajes.html?chat="+encodeURIComponent(cu)}:null,false);
   }else{SocialFeed._sv1Toast(SocialFeed._sv1Err(x.r,x.d,"No se pudo enviar"),null,null,true)}
  })
  .catch(function(){if(send)send.disabled=false;SocialFeed._sv1Toast("Sin conexión — intenta de nuevo",null,null,true)});
 }
 if(inp){
  inp.addEventListener("focus",function(){SocialFeed._storyPaused=true});
  inp.addEventListener("blur",function(){if(!document.querySelector(".ltc-sv1-sheet"))SocialFeed._storyPaused=false});
  inp.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();doSend()}});
 }
 if(send)send.addEventListener("click",doSend);
};
SocialFeed._sv1OpenViewers=function(story){
 var ov=document.getElementById("storyViewerOverlay");
 if(!ov||ov.querySelector(".ltc-sv1-sheet"))return;
 SocialFeed._storyPaused=true;
 ov.classList.add("ltc-sv1-dim");
 var back=document.createElement("div");back.className="ltc-sv1-sheet-back";
 var sh=document.createElement("div");
 sh.className="ltc-sv1-sheet";sh.setAttribute("role","dialog");sh.setAttribute("aria-label","Vistas de tu historia");
 sh.innerHTML='<div class="ltc-sv1-grab" aria-hidden="true"></div>'+
  '<div class="ltc-sv1-sheet-head"><span class="ltc-sv1-sheet-title"><i class="fas fa-eye" aria-hidden="true"></i> Vistas <span id="sv1Total"></span></span>'+
  '<button type="button" class="ltc-sv1-sheet-x" id="sv1SheetX" aria-label="Cerrar"><i class="fas fa-times"></i></button></div>'+
  '<div class="ltc-sv1-list" id="sv1List"><div class="ltc-sv1-empty">Cargando...</div></div>';
 ov.appendChild(back);ov.appendChild(sh);
 requestAnimationFrame(function(){back.classList.add("is-open");sh.classList.add("is-open")});
 back.addEventListener("click",SocialFeed._sv1CloseSheet);
 document.getElementById("sv1SheetX").addEventListener("click",SocialFeed._sv1CloseSheet);
 var sy=null,dy=0;
 sh.addEventListener("touchstart",function(e){var l=document.getElementById("sv1List");if(l&&l.scrollTop>0&&l.contains(e.target)){sy=null;return}sy=e.touches[0].clientY;dy=0},{passive:true});
 sh.addEventListener("touchmove",function(e){if(sy==null)return;dy=e.touches[0].clientY-sy;if(dy>0)sh.style.transform="translateY("+dy+"px)"},{passive:true});
 sh.addEventListener("touchend",function(){if(sy==null)return;if(dy>80){SocialFeed._sv1CloseSheet()}else{sh.style.transform=""}sy=null;dy=0});
 var t=SocialFeed._sv1Tk();
 fetch("/api/stories/"+story.id+"/viewers",{headers:{Authorization:"Bearer "+t}})
 .then(function(r){return r.json().then(function(d){return{r:r,d:d}}).catch(function(){return{r:r,d:null}})})
 .then(function(x){
  var list=document.getElementById("sv1List");if(!list)return;
  if(!(x.r.ok&&x.d&&x.d.success)){
   list.innerHTML='<div class="ltc-sv1-empty">'+SocialFeed.escapeHtml(SocialFeed._sv1Err(x.r,x.d,"No se pudieron cargar las vistas"))+"</div>";
   return;
  }
  var rows=(x.d.data&&x.d.data.viewers)||[];
  var tot=document.getElementById("sv1Total");
  if(tot)tot.textContent="("+((x.d.data&&x.d.data.total!=null)?x.d.data.total:rows.length)+")";
  if(!rows.length){list.innerHTML='<div class="ltc-sv1-empty">Aún no hay vistas</div>';return}
  list.innerHTML=rows.map(function(v){
   var nm=v.name||"Usuario";
   var ini=nm.split(" ").map(function(w){return w[0]}).join("").substring(0,2).toUpperCase();
   var av=v.avatar_url?'<img src="'+SocialFeed.escapeHtml(v.avatar_url)+'" alt="" loading="lazy">':'<span>'+SocialFeed.escapeHtml(ini)+"</span>";
   return '<div class="ltc-sv1-row"><div class="ltc-sv1-ava">'+av+'</div>'+
    '<div class="ltc-sv1-who"><span class="ltc-sv1-name">'+SocialFeed.escapeHtml(nm)+'</span><span class="ltc-sv1-when">'+SocialFeed._sv1Ago(v.viewed_at)+"</span></div>"+
    (v.reaction?'<span class="ltc-sv1-reac" title="Reaccionó">'+SocialFeed.escapeHtml(v.reaction)+"</span>":"")+"</div>";
  }).join("");
 })
 .catch(function(){
  var list=document.getElementById("sv1List");
  if(list)list.innerHTML='<div class="ltc-sv1-empty">Sin conexión — intenta de nuevo</div>';
 });
};
SocialFeed._sv1CloseSheet=function(){
 var ov=document.getElementById("storyViewerOverlay");if(!ov)return;
 var sh=ov.querySelector(".ltc-sv1-sheet"),back=ov.querySelector(".ltc-sv1-sheet-back");
 ov.classList.remove("ltc-sv1-dim");
 if(sh){sh.classList.remove("is-open");setTimeout(function(){sh.remove()},280)}
 if(back){back.classList.remove("is-open");setTimeout(function(){back.remove()},280)}
 SocialFeed._storyPaused=false;
};

;(function(){if(typeof SocialFeed==='undefined')return;var FRESH_MS=6*36e5;
SocialFeed._isFreshEvent=function(ev){if(!ev)return false;if(ev.is_pinned)return true;var t=ev.last_activity_at||ev.created_at;var c=t?new Date(t).getTime():0;return c>0&&(Date.now()-c)<FRESH_MS;};
SocialFeed._ensureRecienZone=function(settledEl){var rz=document.getElementById('sfRecienZone');if(!rz){rz=document.createElement('div');rz.id='sfRecienZone';rz.className='sf-recien-zone sf-recien-empty';rz.innerHTML='<div class="sf-recien-head"><span class="sf-recien-dot" aria-hidden="true"></span><span class="sf-recien-label">Reci\u00e9n</span><span class="sf-recien-sub">Ahora mismo en <span translate="no">La Tanda</span></span></div><div class="sf-recien-list" id="sfRecienList"></div>';}var giro=document.getElementById('ltcGiro');var parent=settledEl.parentElement;if(!parent)return rz;var anchor=(giro&&giro.parentElement===parent)?giro:settledEl;if(rz.parentElement!==parent||rz.nextElementSibling!==anchor){parent.insertBefore(rz,anchor);}return rz;};
SocialFeed._collapseRecien=function(){var rz=document.getElementById('sfRecienZone');if(!rz)return;rz.classList.add('sf-recien-empty');var rl=rz.querySelector('.sf-recien-list');if(rl)rl.innerHTML='';};
SocialFeed._wireZoneObservers=function(el){if(!el)return;var self=this;if(this.videoVisibilityObserver)el.querySelectorAll('.media-video-wrapper video').forEach(function(v){self.videoVisibilityObserver.observe(v)});if(this.viewObserver)el.querySelectorAll('.social-card').forEach(function(c){self.viewObserver.observe(c)});};
SocialFeed._asentadoHeaderHTML=function(){return '<div class="sf-asentado-head"><span class="sf-asentado-dot"></span><span class="sf-asentado-label">Antes</span><span class="sf-asentado-sub">M\u00e1s del feed</span></div>';};
SocialFeed._renderFeedZones=function(list,settledEl){var self=this,fresh=[],settled=[],i;for(i=0;i<list.length;i++){(this._isFreshEvent(list[i])?fresh:settled).push(list[i]);}var rz=this._ensureRecienZone(settledEl);var rl=rz.querySelector('.sf-recien-list');if(fresh.length){rz.classList.remove('sf-recien-empty');rl.innerHTML=fresh.map(function(e){return self.renderEventCard(e)}).join('');}else{rz.classList.add('sf-recien-empty');rl.innerHTML='';}settledEl.innerHTML=(fresh.length&&settled.length?this._asentadoHeaderHTML():'')+settled.map(function(e){return self.renderEventCard(e)}).join('');this._wireZoneObservers(rl);this._wireZoneObservers(settledEl);this._startFreshnessAging&&this._startFreshnessAging();};
})();

;(function(){if(typeof SocialFeed==='undefined')return;
SocialFeed._evById=function(id){for(var j=0;j<this.events.length;j++){if(String(this.events[j].id)===String(id))return this.events[j];}return null;};
SocialFeed._asentadoEnsureHeader=function(settledEl){if(!settledEl.querySelector('.sf-asentado-head')){settledEl.insertAdjacentHTML('afterbegin',this._asentadoHeaderHTML());}};
SocialFeed._ageFreshnessOnce=function(){var self=this;var rz=document.getElementById('sfRecienZone');var rl=rz&&rz.querySelector('.sf-recien-list');var settledEl=document.getElementById('socialFeedList');if(!rl||!settledEl)return 0;var cards=Array.prototype.slice.call(rl.querySelectorAll(':scope > .social-card'));if(!cards.length)return 0;var aged=cards.filter(function(card){var ev=self._evById(card.getAttribute('data-event-id'));return ev&&!self._isFreshEvent(ev);});if(!aged.length)return 0;var remaining=cards.length-aged.length;var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;if(remaining>0)self._asentadoEnsureHeader(settledEl);var moveNow=function(card){var header=settledEl.querySelector('.sf-asentado-head');if(header)settledEl.insertBefore(card,header.nextSibling);else settledEl.insertBefore(card,settledEl.firstChild);};var finalize=function(){var h;if(remaining===0){rz.classList.add('sf-recien-empty');rl.innerHTML='';h=settledEl.querySelector('.sf-asentado-head');if(h)h.remove();}};if(reduce){aged.forEach(function(c){moveNow(c);c.style.transition='';c.style.transform='';c.style.opacity='';});finalize();return aged.length;}var pending=aged.length;aged.forEach(function(card){card.style.willChange='transform,opacity';card.style.transition='transform .3s ease, opacity .3s ease';card.style.transform='translateY(-6px)';card.style.opacity='0';setTimeout(function(){moveNow(card);card.style.transform='translateY(6px)';requestAnimationFrame(function(){requestAnimationFrame(function(){card.style.transition='transform .3s ease, opacity .3s ease';card.style.transform='none';card.style.opacity='1';setTimeout(function(){card.style.willChange='';card.style.transition='';},320);});});if(--pending===0)finalize();},300);});return aged.length;};
SocialFeed._startFreshnessAging=function(){if(this._freshAgingTimer)return;var self=this;this._freshAgingTimer=setInterval(function(){try{self._ageFreshnessOnce();}catch(e){}},60000);};
})();


/* ══════ DESTACADAS (highlights) — Ola 2 FE (2026-10-15) ══════
   Reproducir: GET /api/highlights/:id -> mapear al shape del visor de historias
   (grupo {user:owner, stories:items} con flag isHighlight) -> reusa
   SocialFeed._openStoryViewerFor(data,0,0,true). "Destacar" (FIX2): historia
   PROPIA y pública -> picker (POST /api/stories/:id/highlight). Gestión (FIX3):
   quitar item dentro del visor (DELETE .../items/:itemId). XSS: name/caption por
   escapeHtml; portadas por DOM property .src (nunca innerHTML) + onerror. */
/* ====== DESTACADAS (highlights) — Ola 2 FE ====== */
;(function(){if(typeof SocialFeed==='undefined')return;var SF=SocialFeed;
 SF._hlTk=function(){return localStorage.getItem("auth_token")||localStorage.getItem("authToken")};
 SF._hlMeId=function(){try{var e=localStorage.getItem("latanda_user")||sessionStorage.getItem("latanda_user");if(e){var t=JSON.parse(e);if(t&&(t.id||t.user_id))return t.id||t.user_id}}catch(x){}return localStorage.getItem("user_id")||localStorage.getItem("userId")||null};
 SF._hlEsc=function(z){return SF.escapeHtml(String(z==null?"":z))};
 SF._hlErr=function(x,fb){var d=x&&x.d;var m=d&&((d.data&&d.data.error&&d.data.error.message)||(d.error&&d.error.message)||d.message);return m||fb};
 SF._hlToast=function(msg,isErr){if(window.LaTandaPopup){isErr?LaTandaPopup.showError(msg):LaTandaPopup.showSuccess(msg);}};

 /* mapea una destacada (BE shape) al grupo que consume el visor de historias */
 SF._mapHighlightToGroup=function(hl){
  var owner=hl.owner||{};var me=SF._hlMeId();
  var items=(hl.items||[]).map(function(it){return{id:it.id,media_url:it.media_url,media_type:it.media_type,caption:it.caption,created_at:it.created_at,view_count:0,viewed:true}});
  return {user:{id:owner.id,name:owner.name,avatar_url:owner.avatar_url,handle:owner.handle},stories:items,has_unseen:false,is_own:(owner.id!=null&&me!=null&&String(owner.id)===String(me))};
 };

 /* FIX1 — reproducir: abre el visor existente contra una destacada */
 SF._openHighlightViewer=function(highlightId){
  if(highlightId==null)return;
  var tk=SF._hlTk();var h=tk?{Authorization:"Bearer "+tk}:{};
  fetch("/api/highlights/"+encodeURIComponent(highlightId),{headers:h})
  .then(function(r){return r.json().then(function(d){return{r:r,d:d}}).catch(function(){return{r:r,d:null}})})
  .then(function(x){
   if(!(x.r.ok&&x.d&&x.d.success&&x.d.data)){SF._hlToast(SF._hlErr(x,"No se pudo abrir la destacada"),true);return;}
   var hl=x.d.data;var group=SF._mapHighlightToGroup(hl);
   if(!group.stories.length){SF._hlToast("Esta destacada está vacía",true);return;}
   SF._viewerHighlightId=hl.id;
   SF._openStoryViewerFor([group],0,0,true);
  }).catch(function(){SF._hlToast("Sin conexión. Intenta de nuevo.",true)});
 };

 /* FIX3 — quitar el item actual de una destacada (dentro del visor, dueño) */
 SF._hlRemoveItemFromViewer=function(story){
  if(!SF._viewerHighlightId||!story||story.id==null){SF._storyPaused=false;return;}
  if(!window.confirm("¿Quitar este elemento de la destacada?")){SF._storyPaused=false;return;}
  var tk=SF._hlTk();if(!tk){SF._storyPaused=false;return;}
  fetch("/api/highlights/"+encodeURIComponent(SF._viewerHighlightId)+"/items/"+encodeURIComponent(story.id),{method:"DELETE",headers:{Authorization:"Bearer "+tk}})
  .then(function(r){return r.json().then(function(d){return{r:r,d:d}}).catch(function(){return{r:r,d:null}})})
  .then(function(x){
   if(!(x.r.ok&&x.d&&x.d.success)){SF._hlToast(SF._hlErr(x,"No se pudo quitar"),true);SF._storyPaused=false;return;}
   try{document.dispatchEvent(new CustomEvent("ltc:highlights-changed"))}catch(e){}
   if(x.d.data&&x.d.data.highlight_deleted){SF._closeViewer();return;}
   var groups=SF._viewerData;var g=groups&&groups[SF._currentUserIdx];
   if(g&&g.stories){g.stories.splice(SF._currentStoryIdx,1);
    if(!g.stories.length){SF._closeViewer();return;}
    if(SF._currentStoryIdx>=g.stories.length)SF._currentStoryIdx=g.stories.length-1;
    SF._storyPaused=false;SF._renderStory();
   }else{SF._closeViewer();}
  }).catch(function(){SF._hlToast("Sin conexión. Intenta de nuevo.",true);SF._storyPaused=false;});
 };

 /* FIX2 — picker "Destacar": elegir destacada existente o crear nueva */
 SF._openHighlightPicker=function(storyId){
  if(storyId==null)return;SF._hlInjectCss();
  var esc=SF._hlEsc;var tk=SF._hlTk();if(!tk){SF._hlToast("Inicia sesión",true);return;}
  var me=SF._hlMeId();
  var ex=document.getElementById("ltcHlPicker");if(ex)ex.remove();
  var ov=document.createElement("div");ov.className="ltc-hl-ov";ov.id="ltcHlPicker";
  ov.innerHTML='<div class="ltc-hl-card" role="dialog" aria-modal="true" aria-label="Destacar historia">'+
   '<div class="ltc-hl-head"><h3>Destacar</h3><button class="ltc-hl-x" type="button" aria-label="Cerrar"><i class="fas fa-times"></i></button></div>'+
   '<p class="ltc-hl-hint">Guárdala en una destacada de tu perfil. No desaparece a las 24 horas.</p>'+
   '<div class="ltc-hl-status" id="hlStatus" role="status" aria-live="polite" hidden></div>'+
   '<div class="ltc-hl-sec-t">Crear nueva</div>'+
   '<div class="ltc-hl-newrow"><input class="ltc-hl-input" id="hlNewName" maxlength="40" placeholder="Nombre (ej. Mis tandas)" autocomplete="off"><button class="ltc-hl-btn add" type="button" id="hlCreate">Crear</button></div>'+
   '<div class="ltc-hl-sec-t">O agregar a una existente</div>'+
   '<div class="ltc-hl-list" id="hlList"><div class="ltc-hl-load">Cargando...</div></div>'+
   '</div>';
  document.body.appendChild(ov);requestAnimationFrame(function(){ov.classList.add("active")});
  var close=function(){ov.classList.remove("active");setTimeout(function(){if(ov.parentNode)ov.remove()},200);SF._storyPaused=false;};
  ov.querySelector(".ltc-hl-x").addEventListener("click",close);
  ov.addEventListener("click",function(e){if(e.target===ov)close()});
  var stTimer=null;
  function say(msg,isErr){var el=document.getElementById("hlStatus");if(!el)return;el.textContent=msg;el.classList.toggle("is-err",!!isErr);el.hidden=false;if(stTimer)clearTimeout(stTimer);stTimer=setTimeout(function(){var e2=document.getElementById("hlStatus");if(e2)e2.hidden=true},isErr?5000:2200);}
  function post(body,label){
   fetch("/api/stories/"+encodeURIComponent(storyId)+"/highlight",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tk},body:JSON.stringify(body)})
   .then(function(r){return r.json().then(function(d){return{r:r,d:d}}).catch(function(){return{r:r,d:null}})})
   .then(function(x){
    if(x.r.ok&&x.d&&x.d.success){say("Agregada a "+label,false);try{document.dispatchEvent(new CustomEvent("ltc:highlights-changed"))}catch(e){}setTimeout(close,900);}
    else{say(SF._hlErr(x,"No se pudo destacar"),true);}
   }).catch(function(){say("Sin conexión. Intenta de nuevo.",true)});
  }
  document.getElementById("hlCreate").addEventListener("click",function(){var n=(document.getElementById("hlNewName").value||"").trim();if(!n){say("Escribe un nombre",true);return;}post({name:n},n);});
  document.getElementById("hlList").addEventListener("click",function(e){var b=e.target.closest?e.target.closest(".ltc-hl-pick"):null;if(!b)return;post({highlight_id:b.getAttribute("data-hid")},b.getAttribute("data-name")||"la destacada");});
  fetch("/api/users/"+encodeURIComponent(me)+"/highlights",{headers:{Authorization:"Bearer "+tk}})
  .then(function(r){return r.json()}).then(function(d){
   var arr=(d&&d.data)||[];var el=document.getElementById("hlList");if(!el)return;
   if(!Array.isArray(arr)||!arr.length){el.innerHTML='<div class="ltc-hl-empty">Aún no tienes destacadas. Crea una arriba.</div>';return;}
   el.innerHTML=arr.map(function(hh){return '<button class="ltc-hl-pick" type="button" data-hid="'+esc(hh.id)+'" data-name="'+esc(hh.name)+'"><span class="ltc-hl-pick-cov" data-cov="'+esc(hh.cover_url||"")+'"><i class="fas fa-star" aria-hidden="true"></i></span><span class="ltc-hl-pick-meta"><b>'+esc(hh.name)+'</b><small>'+((parseInt(hh.item_count)||0)===1?'1 elemento':(parseInt(hh.item_count)||0)+' elementos')+'</small></span></button>'}).join("");
   /* portadas por .src (DOM property), nunca innerHTML */
   Array.prototype.forEach.call(el.querySelectorAll(".ltc-hl-pick-cov[data-cov]"),function(sp){var u=sp.getAttribute("data-cov");if(!u)return;var im=document.createElement("img");im.alt="";im.onerror=function(){if(this.parentNode)this.parentNode.removeChild(this)};im.src=u;sp.appendChild(im);});
  }).catch(function(){var el=document.getElementById("hlList");if(el)el.innerHTML='<div class="ltc-hl-empty">No se pudo cargar.</div>'});
 };

 SF._hlInjectCss=function(){
  if(document.getElementById("ltc-hl-css"))return;
  var st=document.createElement("style");st.id="ltc-hl-css";
  st.textContent=".ltc-hl-act{position:absolute;bottom:16px;right:12px;z-index:3;display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:8px 16px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:rgba(10,14,39,.72);color:#fff;font:700 .82rem/1 Inter,system-ui,sans-serif;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}"+
   ".ltc-hl-act i{font-size:.9rem}"+
   ".ltc-hl-act.ltc-hl-rm{background:rgba(120,20,20,.6);border-color:rgba(255,120,120,.35)}"+
   ".ltc-hl-act:focus-visible{outline:2px solid #00d4ff;outline-offset:2px}"+
   ".ltc-hl-ov{position:fixed;inset:0;z-index:100070;display:flex;align-items:flex-end;justify-content:center;background:rgba(4,8,26,.72);opacity:0;transition:opacity .2s}"+
   ".ltc-hl-ov.active{opacity:1}"+
   ".ltc-hl-card{width:100%;max-width:460px;max-height:86vh;display:flex;flex-direction:column;background:#0f1430;border:1px solid rgba(255,255,255,.12);border-radius:20px 20px 0 0;box-shadow:0 -20px 60px -20px rgba(0,0,0,.8);transform:translateY(16px);transition:transform .2s;overflow:hidden;padding-bottom:10px}"+
   ".ltc-hl-ov.active .ltc-hl-card{transform:none}"+
   "@media(min-width:620px){.ltc-hl-ov{align-items:center}.ltc-hl-card{border-radius:20px}}"+
   ".ltc-hl-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 4px}"+
   ".ltc-hl-head h3{margin:0;font-size:1.05rem;color:#fff;font-weight:800}"+
   ".ltc-hl-x{appearance:none;-webkit-appearance:none;border:0;background:rgba(255,255,255,.08);color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:.9rem}"+
   ".ltc-hl-hint{margin:0 18px 8px;font-size:.78rem;line-height:1.4;color:rgba(255,255,255,.6)}"+
   ".ltc-hl-status{margin:0 18px 8px;padding:9px 12px;border-radius:12px;font-size:.8rem;font-weight:600;line-height:1.35;background:rgba(34,213,94,.14);border:1px solid rgba(34,213,94,.4);color:#8af0b2}"+
   ".ltc-hl-status.is-err{background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.45);color:#fda4a4}"+
   ".ltc-hl-status[hidden]{display:none}"+
   ".ltc-hl-sec-t{font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.45);padding:8px 18px 4px}"+
   ".ltc-hl-newrow{display:flex;gap:8px;padding:2px 18px 6px}"+
   ".ltc-hl-input{flex:1;min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font:inherit;font-size:.85rem;padding:9px 12px}"+
   ".ltc-hl-input:focus{outline:none;border-color:#00d4ff}"+
   ".ltc-hl-btn{appearance:none;-webkit-appearance:none;border:0;border-radius:10px;font:inherit;font-size:.82rem;font-weight:800;padding:9px 16px;cursor:pointer;flex:none}"+
   ".ltc-hl-btn.add{background:linear-gradient(135deg,#00d4ff,#8b5cf6);color:#061029}"+
   ".ltc-hl-btn:disabled{opacity:.5;cursor:default}"+
   ".ltc-hl-list{display:flex;flex-direction:column;overflow-y:auto}"+
   ".ltc-hl-pick{display:flex;align-items:center;gap:12px;padding:9px 18px;background:transparent;border:0;cursor:pointer;text-align:left;width:100%}"+
   ".ltc-hl-pick:hover{background:rgba(255,255,255,.04)}"+
   ".ltc-hl-pick-cov{position:relative;width:46px;height:46px;border-radius:50%;overflow:hidden;flex:none;display:grid;place-items:center;background:linear-gradient(160deg,#1c2346,#10152e);color:#fbbf24;font-size:1rem;border:2px solid transparent;background-clip:padding-box;box-shadow:0 0 0 2px #8b5cf6}"+
   ".ltc-hl-pick-cov img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}"+
   ".ltc-hl-pick-meta{flex:1;min-width:0;display:flex;flex-direction:column}"+
   ".ltc-hl-pick-meta b{color:#fff;font-size:.9rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
   ".ltc-hl-pick-meta small{color:rgba(255,255,255,.5);font-size:.74rem}"+
   ".ltc-hl-empty,.ltc-hl-load{padding:14px 18px;color:rgba(255,255,255,.5);font-size:.82rem}";
  (document.head||document.documentElement).appendChild(st);
 };
 try{if(document.head||document.body)SF._hlInjectCss();}catch(e){}
})();
/* expose SocialFeed on window (const no vive en window) — habilita perfil/guardados a abrir el visor de destacadas y el post-detail */
try{if(typeof SocialFeed!=="undefined")window.SocialFeed=SocialFeed;}catch(e){}
