#!/bin/sh
AMS_DIR=~/softwares/ant-media-server
mvn clean install -DskipTests -Dgpg.skip=true
OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi

rm $AMS_DIR/TunaDesk*.war
cp target/TunaDesk.war $AMS_DIR

OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi

cd $AMS_DIR
rm -r webapps/TunaDesk
bash create_app.sh -n TunaDesk -p $AMS_DIR -f $AMS_DIR/TunaDesk.war
#./start-debug.sh
