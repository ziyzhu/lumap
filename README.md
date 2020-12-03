# Lehigh University Campus Interactive Map (lumap)

An interactive map developed with Bentley's iModel.js technology and React to help [the Office of Sustainability at Lehigh University](https://sustainability.lehigh.edu) to drive down costs in energy consumption and improve sustainability on Lehigh campus.  

# Notes

All the requests are routed to our backend API including PI Web API calls. In a normal setup where PI System is configured to accept requests from the domain, lehighmap.com, such rerouting is not needed. However, due to the policies of Lehigh computing research group, the app must access the PI Web API through a proxy server to ensure security. PI Web API provides robust access to the time-series data stored in the Lehigh PI System, however, a normal app does not require all the functionalities offered by it, thus  an interface has been developed on app frontend (PI integrator) to abstract away the complexity of PI Web API. This has made integrating PI data much simpler in this app. 

It also important to implement a reliable authentication flow given that app data as well as the iModel are sensitive data and proprietary to Lehigh University. Anyone outside of Lehigh University must not have access to the app and ofc our data. Luckily, by using a proxy server residing on the Lehigh network automatically requires clients to also be on the same network to access it, which means that only computers connected to the Lehigh VPN can view our app. I’ll spare the details on how it is implemented here. 

And there’s the idea of open-sourcing this app and what it means for its future. It’s worth noting that both the frontend and backend code are open sourced, currently, pull requests to this app must still be approved by zachzhu2016. Credential informations used to set up the backend are not publicly available but it would be simple to pass it on. There may be an ongoing effort to maintain and enhance this app given its potential in driving down the cost of energy consumed at Lehigh as well as making Lehigh a much more sustainable campus. 

## Resources 
Design Philosophy https://medium.com/imodeljs/a-methodology-to-build-a-versatile-imodel-js-application-89e52bbef35a.
App Backend Repo: https://github.com/zachzhu2016/pibridge

## Technologies Used
[iModel.js](https://www.imodeljs.org/), [Blueprint.js](https://blueprintjs.com/docs/), React, TypeScript

## Running it
1. "npm install"
2. "npm run start"

## Pictures
![Card Components](https://github.com/zachzhu2016/lumap/blob/master/images/screenshot1.png)
![Table Component](https://github.com/zachzhu2016/lumap/blob/master/images/screenshot2.png)
![Notification Component](https://github.com/zachzhu2016/lumap/blob/master/images/screenshot3.png)
![Search Bar Component](https://github.com/zachzhu2016/lumap/blob/master/images/screenshot4.png)



