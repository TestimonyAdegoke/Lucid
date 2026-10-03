import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getDreams, MobileDream, starterDreams } from "../src/storage";

const c = { ink:"#352f39", muted:"#807783", background:"#f2ebe6", accent:"#8f78b8", soft:"#e9def6" };

export default function HomeScreen() {
  const router = useRouter();
  const [dreams, setDreams] = useState<MobileDream[]>(starterDreams);
  const [query, setQuery] = useState("");

  useFocusEffect(useCallback(() => { getDreams().then(setDreams); }, []));

  const visibleDreams = dreams.filter((dream) =>
    (dream.title + " " + dream.body + " " + dream.mood).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glow} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}><View style={styles.moon}><Text style={styles.moonText}>☾</Text></View><Text style={styles.brand}>lucid</Text></View>
          <Pressable style={styles.avatar}><Text style={styles.avatarText}>T</Text></Pressable>
        </View>

        <Text style={styles.eyebrow}>MY DREAM BOOK</Text>
        <Text style={styles.greeting}>Good morning ♡</Text>
        <Text style={styles.intro}>A quiet place for the things your sleeping mind wants to keep.</Text>

        <Pressable style={styles.capture} onPress={() => router.push("/new")}>
          <View style={styles.plus}><Text style={styles.plusText}>＋</Text></View>
          <View style={{flex:1}}><Text style={styles.captureTitle}>Write last night's dream</Text><Text style={styles.captureNote}>Before it slips away</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search my dreams..." placeholderTextColor="#9c929e" style={styles.searchInput} />
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionLabel}>RECENT PAGES</Text><Text style={styles.sectionIcon}>☼</Text></View>

        {visibleDreams.map((dream,index) => (
          <Pressable key={dream.id} style={[styles.card,index===0&&styles.cardFeatured]}>
            <View style={styles.cardTop}><Text style={styles.date}>{dream.date}</Text><Text style={styles.heart}>{index===0?"♡":"·"}</Text></View>
            <Text style={styles.cardTitle}>{dream.title}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{dream.body}</Text>
            <View style={styles.moodRow}><View style={styles.moodDot}/><Text style={styles.mood}>{dream.mood}</Text></View>
          </Pressable>
        ))}

        <View style={styles.patternNote}><Text style={styles.sparkle}>✦</Text><Text style={styles.patternText}>Lucid is beginning to notice the little threads between your dreams.</Text></View>
      </ScrollView>

      <View style={styles.tabBar}>
        <Tab icon="▤" label="Journal" active/><Tab icon="✦" label="Patterns"/>
        <Pressable style={styles.fab} onPress={() => router.push("/new")}><Text style={styles.fabText}>＋</Text></Pressable>
        <Tab icon="⌕" label="Explore"/><Tab icon="♡" label="Me"/>
      </View>
    </SafeAreaView>
  );
}

function Tab({icon,label,active=false}:{icon:string;label:string;active?:boolean}) {
  return <View style={styles.tab}><Text style={[styles.tabIcon,active&&styles.tabActive]}>{icon}</Text><Text style={[styles.tabLabel,active&&styles.tabActive]}>{label}</Text></View>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:c.background},glow:{position:"absolute",width:260,height:260,borderRadius:200,backgroundColor:"#eadcf5",right:-90,top:-70,opacity:.6},content:{paddingHorizontal:20,paddingBottom:118},header:{height:72,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},brandRow:{flexDirection:"row",alignItems:"center",gap:8},moon:{width:33,height:33,borderRadius:14,backgroundColor:c.accent,alignItems:"center",justifyContent:"center",transform:[{rotate:"-7deg"}]},moonText:{color:"white",fontSize:19},brand:{fontFamily:"Georgia",fontSize:23,fontWeight:"700",color:c.ink},avatar:{width:36,height:36,borderRadius:18,backgroundColor:c.accent,alignItems:"center",justifyContent:"center"},avatarText:{color:"white",fontWeight:"800"},eyebrow:{marginTop:28,fontSize:10,letterSpacing:2,fontWeight:"800",color:"#665083"},greeting:{marginTop:7,fontFamily:"Georgia",fontSize:40,lineHeight:44,color:c.ink},intro:{marginTop:8,maxWidth:315,fontFamily:"Georgia",fontSize:15,lineHeight:22,color:c.muted},capture:{marginTop:23,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:c.accent,padding:13,borderRadius:17,shadowColor:c.accent,shadowOpacity:.2,shadowRadius:18,shadowOffset:{width:0,height:8}},plus:{width:40,height:40,borderRadius:13,backgroundColor:"rgba(255,255,255,.16)",alignItems:"center",justifyContent:"center"},plusText:{color:"white",fontSize:23,marginTop:-2},captureTitle:{color:"white",fontWeight:"800",fontSize:14},captureNote:{color:"rgba(255,255,255,.72)",fontSize:11,marginTop:3},chevron:{color:"white",fontSize:24,opacity:.8},search:{marginTop:20,flexDirection:"row",alignItems:"center",gap:8,borderBottomWidth:1,borderBottomColor:"rgba(60,45,65,.1)",paddingVertical:10},searchIcon:{color:c.muted,fontSize:20},searchInput:{flex:1,color:c.ink,fontSize:13},sectionHeading:{marginTop:14,marginBottom:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},sectionLabel:{fontSize:10,letterSpacing:1.4,color:c.muted,fontWeight:"800"},sectionIcon:{color:c.accent},card:{marginBottom:10,padding:16,borderRadius:18,backgroundColor:"rgba(255,250,243,.76)",borderWidth:1,borderColor:"rgba(70,50,73,.08)"},cardFeatured:{backgroundColor:c.soft,transform:[{rotate:"-0.3deg"}]},cardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},date:{color:"#665083",fontSize:9,letterSpacing:1.1,fontWeight:"800",textTransform:"uppercase"},heart:{color:c.accent,fontSize:17},cardTitle:{fontFamily:"Georgia",fontSize:21,color:c.ink,marginTop:5},cardBody:{fontFamily:"Georgia",fontSize:13,lineHeight:19,color:c.muted,marginTop:6},moodRow:{flexDirection:"row",alignItems:"center",gap:6,marginTop:12},moodDot:{width:6,height:6,borderRadius:6,backgroundColor:c.accent},mood:{fontFamily:"Georgia",fontStyle:"italic",color:"#665083",fontSize:11},patternNote:{marginTop:12,flexDirection:"row",gap:10,padding:15,borderRadius:15,borderWidth:1,borderStyle:"dashed",borderColor:"#c8b8d7"},sparkle:{color:c.accent,fontSize:18},patternText:{flex:1,fontFamily:"Georgia",lineHeight:18,color:c.muted,fontSize:12},tabBar:{position:"absolute",left:12,right:12,bottom:12,height:68,borderRadius:23,backgroundColor:"rgba(255,250,243,.96)",flexDirection:"row",alignItems:"center",justifyContent:"space-around",shadowColor:"#312735",shadowOpacity:.14,shadowRadius:22,shadowOffset:{width:0,height:10}},tab:{width:54,alignItems:"center",gap:2},tabIcon:{color:c.muted,fontSize:19},tabLabel:{color:c.muted,fontSize:9},tabActive:{color:"#665083"},fab:{width:52,height:52,borderRadius:26,backgroundColor:c.accent,alignItems:"center",justifyContent:"center",transform:[{translateY:-14}]},fabText:{color:"white",fontSize:27,marginTop:-3}
});
