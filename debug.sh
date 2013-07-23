#!/bin/bash

# Run the app in debug mode using hostname to apply the correct settings

APP=`pwd`

if [ $HOSTNAME == "opengeo" ] ; then

	# local
	suite-sdk debug -g http://localhost:8080/geoserver $APP

else

	# geo-dev.geocent.com
	/usr/share/opengeo-suite/sdk/bin/suite-sdk debug -g http://localhost/geoserver $APP

fi
