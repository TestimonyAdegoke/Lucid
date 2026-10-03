import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DreamGraphData, fetchDreamGraph } from "../src/api";

const c={ink:"#352f39",muted:"#807783",paper:"#fffaf3",background:"#f2ebe6",accent:"#8f78b8",soft:"#e9def6"};

export default function DreamGraphScreen(){
  const router=useRouter();
  const [data,setData]=useState<DreamGraphData|null>(null);
  const [loading,setLoading]=useState(true);

  const load=useCallback(()=>{
    setLoading(true);
    fetchDreamGraph().then(setData).catch(()=>setData(null)).finally(()=>setLoading(false));
  },[]);

  useFocusEffect(useCallback(()=>{load();},[load]));

  const connections=useMemo(()=>{
    if(!data)return[];
    return data.edges
      .filter(edge=>edge.kind==="connection")
      .sort((a,b)=>b.strength-a.strength)
      .slice(0,8)
      .map(edge=>({
        ...edge,
        fromDream:data.dreams.find(dream=>dream.id===edge.from),
        toDream:data.dreams.find(dream=>dream.id===edge.to),
      }))
      .filter(item=>item.fromDream&&item.toDream);
  },[data]);

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><Pressable style={s.back} onPress={()=>router.back()}><Text style={s.backText}>‹</Text></Pressable><Text style={s.wordmark}>tardemah</Text><Pressable onPress={load}><Text style={s.refresh}>↻</Text></Pressable></View>
    <Text style={s.eyebrow}>MY DREAM MAP</Text>
    <Text style={s.title}>The little world behind my pages.</Text>
    <Text style={s.intro}>A mobile constellation of the people, places, objects and themes that return. Similarity is descriptive, never a declaration of meaning.</Text>

    {loading?<Text style={s.loading}>connecting the dots…</Text>:!data?<Text style={s.loading}>Tardemah couldn't open the map right now.</Text>:<>
      <Text style={s.section}>BRIGHTEST CONSTELLATIONS</Text>
      <View style={s.constellations}>
        {data.entities.slice(0,12).map((entity,index)=><View key={entity.id} style={[s.entity,index%3===0&&s.entityLarge]}>
          <Text style={s.entityKind}>{entity.kind.toLowerCase()}</Text>
          <Text style={s.entityName}>{entity.label}</Text>
          <Text style={s.entityCount}>{entity.count} {entity.count===1?"dream":"dreams"}</Text>
        </View>)}
      </View>

      <Text style={s.section}>DREAMS THAT ECHO EACH OTHER</Text>
      {!connections.length?<Text style={s.empty}>No strong echoes yet. The map becomes richer as your journal grows.</Text>:connections.map(item=><View key={item.from+"-"+item.to} style={s.connection}>
        <View style={s.connectionMoon}><Text style={s.connectionMoonText}>☾</Text></View>
        <View style={{flex:1}}>
          <Text style={s.connectionTitle}>{item.fromDream?.title} ↔ {item.toDream?.title}</Text>
          <Text style={s.connectionReason}>{[...(item.sharedEntities??[]),...(item.sharedTags??[]).map(tag=>"#"+tag)].slice(0,4).join(" · ")||"similar language and feeling"}</Text>
        </View>
        <Text style={s.connectionScore}>{Math.round(item.strength*100)}%</Text>
      </View>)}
    </>}
  </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:c.background},content:{paddingHorizontal:22,paddingBottom:50},top:{height:70,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{width:36,height:36,borderRadius:18,backgroundColor:c.soft,alignItems:"center",justifyContent:"center"},backText:{fontSize:28,color:"#665083",marginTop:-4},wordmark:{fontFamily:"Georgia",fontSize:20,fontWeight:"700",color:c.ink},refresh:{fontSize:22,color:c.accent,width:36,textAlign:"center"},eyebrow:{marginTop:24,fontSize:9,fontWeight:"800",letterSpacing:1.8,color:"#665083"},title:{marginTop:7,fontFamily:"Georgia",fontSize:36,lineHeight:41,color:c.ink},intro:{marginTop:8,fontFamily:"Georgia",fontSize:14,lineHeight:21,color:c.muted},loading:{marginTop:40,textAlign:"center",fontFamily:"Georgia",fontStyle:"italic",color:c.muted},section:{marginTop:30,fontSize:9,fontWeight:"800",letterSpacing:1.5,color:"#665083"},constellations:{marginTop:13,flexDirection:"row",flexWrap:"wrap",gap:8},entity:{width:"31%",minHeight:88,padding:10,borderRadius:16,backgroundColor:"rgba(255,250,243,.82)",borderWidth:1,borderColor:"#ddd1e3"},entityLarge:{width:"47%"},entityKind:{fontSize:7,textTransform:"uppercase",letterSpacing:.8,color:c.muted},entityName:{fontFamily:"Georgia",fontSize:15,color:c.ink,marginTop:5},entityCount:{fontSize:8,color:"#74647b",marginTop:"auto"},connection:{marginTop:10,flexDirection:"row",alignItems:"center",gap:10,padding:13,borderRadius:16,backgroundColor:"rgba(255,250,243,.8)",borderWidth:1,borderColor:"#e2d7e5"},connectionMoon:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:c.accent},connectionMoonText:{color:"white",fontSize:17},connectionTitle:{fontFamily:"Georgia",fontSize:13,color:c.ink},connectionReason:{fontSize:9,color:c.muted,marginTop:4},connectionScore:{fontSize:9,fontWeight:"800",color:"#665083"},empty:{marginTop:12,fontFamily:"Georgia",fontStyle:"italic",fontSize:13,lineHeight:20,color:c.muted}
});
