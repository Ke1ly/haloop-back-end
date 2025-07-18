import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();
import { authorizeRole, AuthenticatedRequest } from "../middlewares/auth.js";
import { HostProfile } from "../types/User.js";

router.post(
  "/host",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    // 查詢該 user 對應的 HostProfile
    // const hostProfile = await prisma.hostProfile.findUnique({
    //   where: { userId: userId },
    // });
    // if (!hostProfile) {
    //   //create new profile
    // } else {
    //   //編輯
    // }

    try {
      const { address, city, unitDescription, unitName } = req.body;

      //地址轉城市、經緯度
      let geoinfo = await geocodeAddress(address);
      let cityFinal = city || geoinfo.city;
      let district = geoinfo.district;
      let latitude = geoinfo.latitude;
      let longitude = geoinfo.longitude;

      //建立整筆資料
      const data: any = {
        userId,
        unitName,
        unitDescription,
        address,
        city: cityFinal,
        district,
        latitude,
        longitude,
      };

      //存入資料庫
      const newHostProfile = await prisma.hostProfile.create({
        data,
      });

      res.status(201).json({ newHostProfile });
    } catch (error) {
      console.error("儲存profile時發生錯誤:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get(
  "/host",
  authorizeRole("HOST"),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json({ message: "Unauthorized" });

    const profileData = await prisma.hostProfile.findUnique({
      where: { userId: userId },
    });
    res.status(200).json({ profileData });
  }
);

async function geocodeAddress(address: string) {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=zh-TW`;

  const response = await fetch(url);
  const data = (await response.json()) as { results: any[] };

  if (!data.results || data.results.length === 0) {
    console.warn(`Geocoding failed for: ${address}`);
    return {
      latitude: null,
      longitude: null,
      city: null,
      district: null,
      note: "Geocoding failed",
    };
  }

  const result = data.results[0];

  const lat = result.geometry.lat;
  const lng = result.geometry.lng;
  const components = result.components;

  return {
    latitude: lat,
    longitude: lng,
    city: components.city || components.county || components.town,
    district:
      components.city_district || components.suburb || components.village,
  };
}

export default router;
