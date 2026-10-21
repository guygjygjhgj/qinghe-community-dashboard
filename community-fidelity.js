// Native-coordinate contracts for the user's approved community mockups.
// Only presentation is changed; dates, counts, classification and scores stay dynamic.
export const referenceViews = Object.freeze({
  residents:{width:1435,rail:223,left:32,right:28,top:22,hero:196,nav:16,body:18,section:30,small:16},
  profile:{width:1198,rail:218,left:27,right:28,top:20,hero:145,nav:14,body:15,section:24,small:13},
  // The source crop includes the next row at its bottom. Keep a clean viewport.
  dashboard:{width:999,rail:159,left:18,right:14,top:0,hero:145,nav:12,body:13,section:18,small:11},
  cognition:{width:1122,rail:190,left:25,right:18,top:15,hero:139,nav:14,body:13,section:22,small:12},
  assessments:{width:878,rail:155,left:21,right:18,top:12,hero:113,nav:11,body:11,section:17,small:10},
  models:{width:1469,rail:274,left:30,right:37,top:27,hero:269,nav:18,body:20,section:36,small:17},
  import:{width:1435,rail:245,left:24,right:27,top:26,hero:239,nav:18,body:20,section:32,small:17},
  reports:{width:1038,rail:178,left:20,right:17,top:0,hero:198,nav:14,body:14,section:22,small:12}
});
const exactBase=new URL('./community-assets/exact/',import.meta.url);
export function applyReferenceScale(view=document.body.dataset.qhView||'dashboard'){
  const profile=view==='residents'&&document.querySelector('#resident-profile:not(.hidden)');
  const key=profile?'profile':view,ref=referenceViews[key]||referenceViews.dashboard;
  document.body.dataset.qhReference=key;
  const styles=document.body.style,scale=innerWidth>720?innerWidth/ref.width:1;
  styles.setProperty('--u',scale+'px');
  styles.setProperty('--nu',(scale*ref.rail/223)+'px');
  const heroWidth=key==='reports'?ref.width-ref.rail:key==='dashboard'?ref.width-ref.rail-ref.left:ref.width-ref.rail-ref.left-ref.right;
  styles.setProperty('--hero-ratio',String(heroWidth/ref.hero));
  for(const [name,value] of Object.entries(ref))styles.setProperty('--ref-'+name,String(value));
  const header=document.querySelector('.qh-brand-header');
  if(header){
    const hero=key==='dashboard'?new URL('./community-assets/generated/hero-dashboard-hd-v2.png',import.meta.url):key==='assessments'?new URL('./community-assets/generated/hero-assessments-hd-v2.png',import.meta.url):new URL('hero-'+key+'.png',exactBase);
    header.style.backgroundImage=`url("${hero.href}")`;
    header.dataset.reference=key;
  }
}
export function initReference(){
  const brand=document.querySelector('.brand-mark img');if(brand)brand.src=new URL('brand-sprout.png',exactBase).href;
  for(const link of document.querySelectorAll('.rail [data-view]')){
    const icon=link.querySelector('span');
    if(icon)icon.innerHTML=`<img src="${new URL('nav-'+link.dataset.view+'.png',exactBase).href}" width="33" height="33" alt="">`;
  }
  window.addEventListener('resize',()=>applyReferenceScale());
  const profile=document.getElementById('resident-profile');
  if(profile)new MutationObserver(()=>applyReferenceScale()).observe(profile,{attributes:true,attributeFilter:['class']});
  applyReferenceScale();
}
