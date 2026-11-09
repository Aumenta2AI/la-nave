export const councilMembers = [
  {
    "id": "consejo",
    "slug": "michael-jordan",
    "name": "Michael Jordan",
    "specialty": "Ventas y alto rendimiento",
    "source": "https://www.nba.com/hornets/front-office",
    "model": "/models/council/michael-jordan.glb"
  },
  {
    "id": "consejo-experto-1",
    "slug": "simon-sinek",
    "name": "Simon Sinek",
    "specialty": "Liderazgo y propósito",
    "source": "https://simonsinek.com/simons-bio/",
    "model": "/models/council/simon-sinek.glb"
  },
  {
    "id": "consejo-experto-2",
    "slug": "sabri-suby",
    "name": "Sabri Suby",
    "specialty": "Copy y conversión",
    "source": "https://kingkong.co/about-us/",
    "model": "/models/council/sabri-suby.glb"
  },
  {
    "id": "consejo-experto-3",
    "slug": "neil-patel",
    "name": "Neil Patel",
    "specialty": "SEO y posicionamiento",
    "source": "https://neilpatel.com/about/",
    "model": "/models/council/neil-patel.glb"
  },
  {
    "id": "consejo-experto-4",
    "slug": "alex-hormozi",
    "name": "Alex Hormozi",
    "specialty": "Ofertas y escalamiento",
    "source": "https://www.acquisition.com/about-alex-hormozi-acquisition",
    "model": "/models/council/alex-hormozi.glb"
  },
  {
    "id": "consejo-experto-5",
    "slug": "satya-nadella",
    "name": "Satya Nadella",
    "specialty": "Tecnología y transformación IA",
    "source": "https://news.microsoft.com/hitrefresh/image-gallery.html",
    "model": "/models/council/satya-nadella.glb"
  }
] as const;
export function councilMember(id:string){return councilMembers.find(p=>p.id===id);}
