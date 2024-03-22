// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { GOOGLE_MAPS_API_KEY } from "../env.js";

/**
 * Asynchronously initializes and loads the Google Maps JavaScript API with specific configurations.
 * This function is responsible for adding a script to the document head, loading the Google Maps Places library,
 * and creating a PlacesService for use in the application.
 *
 * @param {string} GOOGLE_MAPS_API_KEY - The Google Maps API key required for API access.
 */
export async function initGoogleMaps() {
  try {
    const script = document.createElement("script");
    script.type = "text/javascript";
    // prettier-ignore
    script.innerText = (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

    // add the script to the document head
    document.head.appendChild(script);

    // Load the Google Maps places libray
    await google.maps.importLibrary("places");
  } catch (error) {
    console.error(error);
  }
}
