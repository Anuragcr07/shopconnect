
declare module "sst" {
  export interface Resource {
    "MyWeb": {
      "type": "sst.aws.Nextjs"
      "url": string
    }
  }
}
/// <reference path="sst-env.d.ts" />

import "sst"
export {}