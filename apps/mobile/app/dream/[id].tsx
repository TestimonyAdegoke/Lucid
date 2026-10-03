import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { deleteDream, updateDream } from "../../src/sync";
import { findCachedDream, MobileDream } from "../../src/storage";

const c={ink:"#352f39",muted:"#807783",paper:"#fffaf3",accent:"#8f78b8",soft:"#e9def6"};
const moods=["peaceful","happy","curious","nostalgic","anxious","strange"];

export default function DreamScreen(){
  const router=useRouter();
  const {id}=useLocalSearchParams<{id:string}>();
  const [dream,setDream]=useState<MobileDream|null>(null);
  const [editing,setEditing]=useState(false);
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const [mood,setMood]=useState("peaceful");
  const [tags,setTags]=useState("");
  const [saving,setSaving]=useState(false);

  const load=useCallback(async()=>{
    if(!id) return;
    const next=await findCachedDream(id);
    setDream(next);
    if(next){
      setTitle(next.title);setBody(next.body);setMood(next.mood);setTags(next.tags.join(", "));
    }
  },[id]);

  useFocusEffect(useCallback(()=>{void load();},[load]));

  async function save(){
    if(!dream||!body.trim()||saving)return;
    setSaving(true);
    try{
      const next=await updateDream(dream.clientId,{
        title:title.trim()||"Untitled dream",
        body:body.trim(),
        mood,
        tags:tags.split(",").map(t=>t.trim().toLowerCase().replace(/^#/,"")).filter(Boolean),
      });
      setDream(next);setEditing(false);
    }finally{setSaving(false);}
  }

  async function toggle<K extends "isFavorite"|"isLucid"|"isNightmare">(key:K){
    if(!dream)return;
    const next=await updateDream(dream.clientId,{[key]:!dream[key]} as Pick<MobileDream,K>);
    setDream(next);
  }

  function remove(){
    if(!dream)return;
    Alert.alert("Remove this dream?","This page will be permanently removed.",[
      {text:"Keep it",style:"cancel"},
      {text:"Remove",style:"destructive",onPress:async()=>{
        try{await deleteDream(dream.clientId);router.back();}
        catch{Alert.alert("Couldn't remove this page","Connect to the internet and try again.");}
      }}
    ]);
  }

  if(!dream){
    return <SafeAreaView style={s.safe}><View style={s.loading}><Text style={s.loadingText}>Opening dream page…</Text></View></SafeAreaView>;
  }

  const date=new Intl.DateTimeFormat("en",{month:"long",day:"numeric",year:"numeric"}).format(new Date(dream.dreamedAt));

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.top}>
        <Pressable style={s.circle} onPress={()=>router.back()}><Text style={s.circleText}>‹</Text></Pressable>
        <Text style={s.sync}>{dream.syncStatus==="synced"?"synced":dream.syncStatus==="pending-create"?"saved offline":"changes pending"}</Text>
        <Pressable style={s.circle} onPress={()=>toggle("isFavorite")}><Text style={[s.star,dream.isFavorite&&s.starOn]}>★</Text></Pressable>
      </View>

      <Text style={s.date}>{date.toUpperCase()}</Text>

      {editing ? <>
        <TextInput style={s.titleInput} value={title} onChangeText={setTitle}/>
        <TextInput style={s.bodyInput} multiline value={body} onChangeText={setBody} textAlignVertical="top"/>
        <Text style={s.label}>I WOKE UP FEELING</Text>
        <View style={s.chips}>{moods.map(item=><Pressable key={item} onPress={()=>setMood(item)} style={[s.chip,mood===item&&s.chipOn]}><Text style={[s.chipText,mood===item&&s.chipTextOn]}>{item}</Text></Pressable>)}</View>
        <Text style={[s.label,{marginTop:20}]}>LITTLE THINGS I WANT TO REMEMBER</Text>
        <TextInput style={s.tagsInput} value={tags} onChangeText={setTags} placeholder="water, school, flying…" placeholderTextColor="#a79ca8"/>
        <Pressable style={s.save} onPress={save}><Text style={s.saveText}>{saving?"Saving…":"Save changes  ♡"}</Text></Pressable>
        <Pressable onPress={()=>setEditing(false)}><Text style={s.cancel}>Never mind</Text></Pressable>
      </> : <>
        <Text style={s.title}>{dream.title}</Text>
        <View style={s.moodRow}><View style={s.dot}/><Text style={s.mood}>I woke up feeling {dream.mood}</Text></View>
        <Text style={s.body}>{dream.body}</Text>
        <View style={s.tags}>{dream.tags.map(tag=><Text key={tag} style={s.tag}>#{tag}</Text>)}</View>

        <View style={s.memoryRow}>
          {dream.vividness&&<Text style={s.memoryPill}>✦ vivid {dream.vividness}/10</Text>}
          {dream.isLucid&&<Text style={s.memoryPill}>☾ lucid</Text>}
          {dream.isNightmare&&<Text style={s.memoryPill}>☁ nightmare</Text>}
        </View>

        <View style={s.reflection}><Text style={s.reflectionSpark}>✦</Text><View style={{flex:1}}><Text style={s.reflectionLabel}>A GENTLE REFLECTION</Text><Text style={s.reflectionText}>As your journal grows, Tardemah can connect this page to recurring feelings, people, places and details.</Text></View></View>

        <View style={s.actions}>
          <Pressable style={s.action} onPress={()=>setEditing(true)}><Text style={s.actionText}>✎ Edit page</Text></Pressable>
          <Pressable style={[s.action,dream.isLucid&&s.actionOn]} onPress={()=>toggle("isLucid")}><Text style={s.actionText}>☾ Lucid</Text></Pressable>
          <Pressable style={[s.action,dream.isNightmare&&s.actionOn]} onPress={()=>toggle("isNightmare")}><Text style={s.actionText}>☁ Nightmare</Text></Pressable>
        </View>

        <Pressable onPress={remove}><Text style={s.remove}>Remove this page</Text></Pressable>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:c.paper},content:{paddingHorizontal:24,paddingBottom:50},loading:{flex:1,alignItems:"center",justifyContent:"center"},loadingText:{fontFamily:"Georgia",color:c.muted},top:{height:70,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},circle:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:c.soft},circleText:{fontSize:28,color:"#665083",marginTop:-4},sync:{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:c.muted},star:{fontSize:18,color:"#9b8f9d"},starOn:{color:c.accent},date:{marginTop:22,fontSize:9,letterSpacing:1.7,fontWeight:"800",color:"#665083"},title:{marginTop:10,fontFamily:"Georgia",fontSize:40,lineHeight:44,color:c.ink},moodRow:{marginTop:13,flexDirection:"row",gap:7,alignItems:"center"},dot:{width:6,height:6,borderRadius:6,backgroundColor:c.accent},mood:{fontFamily:"Georgia",fontStyle:"italic",color:c.muted,fontSize:13},body:{marginTop:35,fontFamily:"Georgia",fontSize:17,lineHeight:29,color:c.ink},tags:{marginTop:20,flexDirection:"row",gap:7,flexWrap:"wrap"},tag:{fontSize:10,color:"#665083",backgroundColor:c.soft,paddingHorizontal:9,paddingVertical:5,borderRadius:20},memoryRow:{marginTop:15,flexDirection:"row",gap:7,flexWrap:"wrap"},memoryPill:{fontSize:10,color:c.muted,borderWidth:1,borderColor:"#e0d6e3",paddingHorizontal:9,paddingVertical:6,borderRadius:20},reflection:{marginTop:35,flexDirection:"row",gap:10,padding:16,borderWidth:1,borderStyle:"dashed",borderColor:"#cbbbd8",borderRadius:16,backgroundColor:"rgba(233,222,246,.28)"},reflectionSpark:{color:c.accent,fontSize:18},reflectionLabel:{fontSize:9,fontWeight:"800",letterSpacing:1.2,color:"#665083"},reflectionText:{marginTop:5,fontFamily:"Georgia",fontSize:12,lineHeight:18,color:c.muted},actions:{marginTop:26,flexDirection:"row",gap:7,flexWrap:"wrap"},action:{borderWidth:1,borderColor:"#ded4df",paddingHorizontal:11,paddingVertical:8,borderRadius:20},actionOn:{backgroundColor:c.soft,borderColor:c.accent},actionText:{fontSize:11,color:"#665083"},remove:{textAlign:"center",marginTop:32,color:"#a56d67",fontSize:11},titleInput:{marginTop:10,fontFamily:"Georgia",fontSize:31,color:c.ink,borderBottomWidth:1,borderBottomColor:"#e4dce6",paddingVertical:10},bodyInput:{minHeight:230,marginTop:15,fontFamily:"Georgia",fontSize:17,lineHeight:28,color:c.ink},label:{fontSize:9,letterSpacing:1.2,fontWeight:"800",color:c.muted},chips:{marginTop:9,flexDirection:"row",gap:7,flexWrap:"wrap"},chip:{borderWidth:1,borderColor:"#e0d6e3",paddingHorizontal:9,paddingVertical:6,borderRadius:20},chipOn:{backgroundColor:c.soft,borderColor:c.accent},chipText:{fontSize:10,color:c.muted},chipTextOn:{color:"#665083",fontWeight:"700"},tagsInput:{marginTop:8,borderBottomWidth:1,borderBottomColor:"#e4dce6",paddingVertical:10,fontFamily:"Georgia",fontSize:14,color:c.ink},save:{marginTop:28,backgroundColor:c.accent,padding:15,borderRadius:15,alignItems:"center"},saveText:{color:"white",fontWeight:"800"},cancel:{textAlign:"center",marginTop:15,color:c.muted,fontSize:11}
});
