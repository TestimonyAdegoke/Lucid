import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { loadCachedDreams, MobileDream } from "../src/storage";

const c={ink:"#352f39",muted:"#807783",paper:"#fffaf3",background:"#f2ebe6",accent:"#8f78b8",soft:"#e9def6"};

function rank(values:string[]){
  const counts=new Map<string,number>();
  values.filter(Boolean).forEach(value=>counts.set(value,(counts.get(value)??0)+1));
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
}

export default function PatternsScreen(){
  const router=useRouter();
  const [dreams,setDreams]=useState<MobileDream[]>([]);
  useFocusEffect(useCallback(()=>{loadCachedDreams().then(setDreams);},[]));

  const moods=useMemo(()=>rank(dreams.map(d=>d.mood)),[dreams]);
  const tags=useMemo(()=>rank(dreams.flatMap(d=>d.tags)),[dreams]);

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><Pressable style={s.back} onPress={()=>router.back()}><Text style={s.backText}>‹</Text></Pressable><Text style={s.wordmark}>lucid</Text><View style={{width:36}}/></View>
    <Text style={s.eyebrow}>THREADS IN MY DREAM BOOK</Text>
    <Text style={s.title}>Patterns, gently noticed.</Text>
    <Text style={s.intro}>These are simple patterns from your own pages, not declarations about what your dreams mean.</Text>

    <View style={s.stats}>
      <Stat value={dreams.length} label="dreams"/>
      <Stat value={dreams.filter(d=>d.isLucid).length} label="lucid"/>
      <Stat value={dreams.filter(d=>d.isNightmare).length} label="nightmares"/>
      <Stat value={dreams.filter(d=>d.isFavorite).length} label="kept close"/>
    </View>

    <Text style={s.section}>FEELINGS THAT RETURN</Text>
    {!moods.length?<Text style={s.empty}>Your patterns will grow as you add dream pages.</Text>:moods.map(([name,count])=><View key={name} style={s.row}><Text style={s.rowName}>{name}</Text><View style={s.bar}><View style={[s.fill,{flex:count}]}/><View style={{flex:Math.max(0,moods[0][1]-count)}}/></View><Text style={s.count}>{count}</Text></View>)}

    <Text style={[s.section,{marginTop:32}]}>DETAILS THAT REPEAT</Text>
    {tags.length?<View style={s.tags}>{tags.map(([name,count])=><View style={s.tag} key={name}><Text style={s.tagText}>#{name}</Text><Text style={s.tagCount}>{count}</Text></View>)}</View>:<Text style={s.empty}>Add tags like people, places, objects or themes to your dream pages and recurring details will appear here.</Text>}
  </ScrollView></SafeAreaView>;
}

function Stat({value,label}:{value:number;label:string}){return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:c.background},content:{paddingHorizontal:22,paddingBottom:45},top:{height:70,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:36,height:36,borderRadius:18,backgroundColor:c.soft,alignItems:"center",justifyContent:"center"},backText:{fontSize:28,color:"#665083",marginTop:-4},wordmark:{fontFamily:"Georgia",fontSize:20,fontWeight:"700",color:c.ink},eyebrow:{marginTop:24,fontSize:9,fontWeight:"800",letterSpacing:1.8,color:"#665083"},title:{marginTop:7,fontFamily:"Georgia",fontSize:36,lineHeight:41,color:c.ink},intro:{marginTop:8,fontFamily:"Georgia",fontSize:14,lineHeight:21,color:c.muted},stats:{marginTop:28,flexDirection:"row",gap:8},stat:{flex:1,backgroundColor:"rgba(255,250,243,.8)",borderWidth:1,borderColor:"#e5dce6",borderRadius:16,paddingVertical:14,alignItems:"center"},statValue:{fontFamily:"Georgia",fontSize:23,color:c.ink},statLabel:{fontSize:8,textTransform:"uppercase",letterSpacing:.7,color:c.muted,marginTop:3},section:{marginTop:30,fontSize:9,fontWeight:"800",letterSpacing:1.5,color:"#665083"},row:{marginTop:13,flexDirection:"row",alignItems:"center",gap:10},rowName:{width:78,fontFamily:"Georgia",fontSize:12,color:c.ink},bar:{height:7,flex:1,flexDirection:"row",borderRadius:7,backgroundColor:"#e8e0e8",overflow:"hidden"},fill:{height:7,borderRadius:7,backgroundColor:c.accent},count:{width:20,textAlign:"right",fontSize:10,color:c.muted},empty:{marginTop:12,fontFamily:"Georgia",fontStyle:"italic",fontSize:13,lineHeight:20,color:c.muted},tags:{marginTop:12,flexDirection:"row",gap:8,flexWrap:"wrap"},tag:{flexDirection:"row",gap:6,alignItems:"center",backgroundColor:c.soft,paddingHorizontal:10,paddingVertical:7,borderRadius:20},tagText:{fontSize:11,color:"#665083"},tagCount:{fontSize:9,color:c.muted}
});
