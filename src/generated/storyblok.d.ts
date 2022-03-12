namespace Storyblok {
  export interface Button {
    text: string;
    link?:
      | {
          cached_url?: string;
          linktype?: string;
          [k: string]: any;
        }
      | {
          id?: string;
          cached_url?: string;
          linktype?: "story";
          [k: string]: any;
        }
      | {
          url?: string;
          cached_url?: string;
          linktype?: "asset" | "url";
          [k: string]: any;
        }
      | {
          email?: string;
          linktype?: "email";
          [k: string]: any;
        };
    style: "" | "solid" | "outline" | "link";
    _uid: string;
    component: "Button";
    [k: string]: any;
  }

  export interface Card {
    title: string;
    subtitle?: string;
    body: string;
    button?: Button[];
    id?: string;
    classes?: string;
    _uid: string;
    component: "Card";
    [k: string]: any;
  }

  export interface Carousel {
    title: string;
    auto_scroll?: boolean;
    auto_scroll_delay?: number;
    blocks?: Card[];
    _uid: string;
    component: "Carousel";
    [k: string]: any;
  }

  export interface CaseStudies {
    title: string;
    subtitle?: string;
    stories: any[];
    _uid: string;
    component: "CaseStudies";
    [k: string]: any;
  }

  export interface CaseStudy {
    tags?: any[];
    featured_image: {
      alt?: string;
      copyright?: string;
      id: number;
      filename: string;
      name: string;
      title?: string;
    };
    blocks?: (Carousel | CaseStudies | Grid | Headline | SplashBanner)[];
    _uid: string;
    component: "Case Study";
    [k: string]: any;
  }

  export interface Grid {
    mobile_columns: string;
    mobile_spacing: string;
    title?: string;
    numbered_list?: boolean;
    blocks?: Card[];
    desktop_columns?: string;
    desktop_spacing?: string;
    tablet_columns: string;
    tablet_spacing: string;
    _uid: string;
    component: "Grid";
    [k: string]: any;
  }

  export interface Headline {
    title: string;
    subtitle?: string;
    body: any;
    _uid: string;
    component: "Headline";
    [k: string]: any;
  }

  export interface Page {
    meta_title: string;
    meta_description: string;
    meta_image?: {
      alt?: string;
      copyright?: string;
      id: number;
      filename: string;
      name: string;
      title?: string;
    };
    meta_robots?: ("noindex" | "nofollow")[];
    canonical_url?:
      | {
          cached_url?: string;
          linktype?: string;
          [k: string]: any;
        }
      | {
          id?: string;
          cached_url?: string;
          linktype?: "story";
          [k: string]: any;
        }
      | {
          url?: string;
          cached_url?: string;
          linktype?: "asset" | "url";
          [k: string]: any;
        }
      | {
          email?: string;
          linktype?: "email";
          [k: string]: any;
        };
    blocks?: (Carousel | CaseStudies | Grid | Headline | SplashBanner)[];
    _uid: string;
    component: "Page";
    [k: string]: any;
  }

  export interface SplashBanner {
    alignment:
      | ""
      | "text-left items-start"
      | "text-center items-center"
      | "text-right items-end";
    title: string;
    subtitle?: string;
    content?: string;
    image: {
      alt?: string;
      copyright?: string;
      id: number;
      filename: string;
      name: string;
      title?: string;
    };
    button?: Button[];
    _uid: string;
    component: "SplashBanner";
    [k: string]: any;
  }

  export interface Theme {
    h1_font_size?: string;
    h1_line_height?: string;
    h2_font_size?: string;
    h2_line_height?: string;
    h3_font_size?: string;
    h3_line_height?: string;
    h4_font_size?: string;
    h4_line_height?: string;
    h5_font_size?: string;
    h5_line_height?: string;
    h6_font_size?: string;
    h6_line_height?: string;
    _uid: string;
    component: "Theme";
    [k: string]: any;
  }
}
