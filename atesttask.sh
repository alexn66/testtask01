#!/bin/bash

# main script for pm2 launching ------------------------------
#
# usage eg: ./atesttask.sh start
# usage eg: ./atesttask.sh stop


KEYSERVER_PATH=`cat config.json | grep path | awk -F"\"" '{print $4}'`
KEYSERVER_PATH_LOGS=$KEYSERVER_PATH/logs
echo "atesttask.sh: KEYSERVER_PATH=     ${KEYSERVER_PATH}"
echo "atesttask.sh: KEYSERVER_PATH_LOGS=${KEYSERVER_PATH_LOGS}"

ARG_ACTION=$1





function printerrargs() {
    printf "\e[1;31mwrong arg${1}\e[0m\n";
    printf "Correct usage: atesttask.sh \e[1;36m<start|stop lint|lintfix>\e[0m\n";
    exit 1
}



case $ARG_ACTION in
    "start")
        pm2 start index.js --name "testtask01" --watch "lib/" -o "$KEYSERVER_PATH_LOGS/api.log" -e "$KEYSERVER_PATH_LOGS/api.error.log" --merge-logs
        ;;
    "stop")
        pm2 stop "testtask01"
        ;;

    "lint")
        clear
        ./node_modules/.bin/eslint index.js lib/
        ;;
    "lintfix")
        clear
        ./node_modules/.bin/eslint --fix index.js lib/
        ;;

    *)
        printerrargs 1
        ;;
esac

exit 0