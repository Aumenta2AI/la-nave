import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',globalSetup:'./tests/setup.ts',timeout:60000,workers:1,reporter:[['list'],['html',{open:'never'}]],use:{baseURL:'http://127.0.0.1:13211',viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{channel:'chrome'}}});
