import { useAppContext } from "@/context";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  View,
  Text,
  Platform,
  ScrollView,
  Pressable,
  ImageBackground,
  Dimensions,
  TextInput,
  BackHandler,
} from "react-native";


export default function HomeScreen() {

  const { language } = useAppContext()


  return (
    <>

      <View className="h-screen bg-black px-6 text-center  items-center justify-center">
        <Text className="text-white">Hello from Home screen and context is working your language  is  {language}</Text>
      </View>
    </>
  );
}



