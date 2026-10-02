import { serverSync } from '../ServerSync';
import { IsoItemTooltip } from './IsoTooltip';
const list=(value:any)=>Array.isArray(value)?value:[];
export function IsoAuthoritativeCrafting({snapshot}:{snapshot:any}){
 const player=snapshot?.player||{};
 const recipes=list(snapshot?.official?.craftingRecipes||snapshot?.recipes||player.recipes);
 const gems=list(snapshot?.official?.gems||player.gems);
 const row:React.CSSProperties={padding:9,marginTop:6,border:'1px solid rgba(238,203,126,.15)',borderRadius:9,background:'rgba(255,255,255,.03)'};
 return <div style={{padding:12}}><b>Crafting & Socketing</b><div style={{fontSize:11,opacity:.6}}>Materiais, qualidade e resultado são validados pelo servidor.</div><small style={{display:'block',marginTop:10}}>RECEITAS · {recipes.length}</small>{recipes.map((recipe:any,index:number)=><div key={recipe.id||index} style={row}><b>{recipe.name||recipe.id||'Receita'}</b><div style={{fontSize:11,opacity:.7}}>{list(recipe.inputs).map((input:any)=>`${input.quantity||1}x ${input.name||input.id}`).join(' · ')}</div><button onClick={()=>serverSync.sendOfficial('craft',{recipeId:recipe.id})}>Criar</button></div>)}<small style={{display:'block',marginTop:12}}>GEMS · {gems.length}</small>{gems.map((gem:any,index:number)=><IsoItemTooltip key={gem.id||index} item={gem}><div style={row}><b>{gem.icon||'Gem'} {gem.name||gem.id}</b><button style={{float:'right'}} onClick={()=>serverSync.sendOfficial('socket',{gemId:gem.id})}>Socket</button></div></IsoItemTooltip>)}</div>;
}
