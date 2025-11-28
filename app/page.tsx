import Image from "next/image";
import styles from "./page.module.css";
import { WeatherCard } from "@/components/Dashboard/weather-card";

export default function Home() {
  return (
    <div>
      <WeatherCard />
    </div>
  );
}
