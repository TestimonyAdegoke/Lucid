import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createDream } from "../src/sync";

const moods=["peaceful","happy","curious","nostalgic","anxious","strange"];

export default function NewDreamScreen(){
  const router=useRouter();
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const [mood,setMood]=useState("peaceful");
  const [saving,setSaving]=useState(false);

  async function save(){
    if(!body.trim()){
      Alert.alert("A tiny fragment is enough","Write anything you still remember from the dream.");
      return;
    }

    if(saving) return;
    setSaving(true);

    try {
      await createDream({title,body,mood});
      router.back();
    } catch {
      Alert.alert("Lucid couldn't keep this dream","Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return(
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.top}><Pressable style={s.close} disabled={saving} onPress={()=>router.back()}><Text style={s.closeText}>×</Text></Pressable><Text style={s.lock}>private page · ♡</Text></View>
          <Text style={s.eyebrow}>A NEW DREAM</Text>
          <Text style={s.heading}>What do you remember?</Text>
          <Text style={s.intro}>Fragments count. It does not have to make sense yet.</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Give it a little title... (optional)" placeholderTextColor="#a69aa6" style={s.title}/>
          <TextInput autoFocus multiline value={body} onChangeText={setBody} placeholder="I was somewhere..." placeholderTextColor="#b2a7af" textAlignVertical="top" style={s.body}/>
          <Text style={s.moodLabel}>I WOKE UP FEELING</Text>
          <View style={s.moods}>{moods.map(item=><Pressable key={item} onPress={()=>setMood(item)} style={[s.mood,mood===item&&s.moodSelected]}><Text style={[s.moodText,mood===item&&s.moodTextSelected]}>{item}</Text></Pressable>)}</View>
          <Pressable style={[s.save,(!body.trim()||saving)&&s.saveDisabled]} onPress={save}>
            <Text style={s.saveText}>{saving ? "Keeping your dream…" : "Keep this dream  ♡"}</Text>
          </Pressable>
          <Text style={s.footer}>If you're offline, Lucid keeps the page safely on this device and syncs it later.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:"#fffaf3"},content:{flexGrow:1,paddingHorizontal:23,paddingBottom:30},top:{height:70,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},close:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:"#eee3f5"},closeText:{fontSize:26,color:"#665083",marginTop:-3},lock:{color:"#918694",fontSize:10,textTransform:"uppercase",letterSpacing:1},eyebrow:{marginTop:20,color:"#665083",fontSize:10,letterSpacing:2,fontWeight:"800"},heading:{marginTop:7,fontFamily:"Georgia",fontSize:38,lineHeight:43,color:"#352f39"},intro:{marginTop:8,fontFamily:"Georgia",color:"#807783",fontSize:14,lineHeight:21},title:{marginTop:30,paddingVertical:12,borderBottomWidth:1,borderBottomColor:"rgba(60,45,65,.1)",fontFamily:"Georgia",fontSize:21,color:"#352f39"},body:{minHeight:250,paddingTop:18,fontFamily:"Georgia",fontSize:17,lineHeight:29,color:"#352f39"},moodLabel:{color:"#8b7e8d",fontSize:9,letterSpacing:1.3,fontWeight:"800"},moods:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:10},mood:{paddingHorizontal:10,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:"rgba(60,45,65,.1)"},moodSelected:{backgroundColor:"#e9def6",borderColor:"#8f78b8"},moodText:{color:"#807783",fontSize:11},moodTextSelected:{color:"#665083",fontWeight:"700"},save:{marginTop:28,padding:15,alignItems:"center",borderRadius:15,backgroundColor:"#8f78b8"},saveDisabled:{opacity:.45},saveText:{color:"white",fontWeight:"800",fontSize:14},footer:{textAlign:"center",marginTop:15,color:"#9a8f9a",fontFamily:"Georgia",fontSize:11,fontStyle:"italic",lineHeight:17}
});
