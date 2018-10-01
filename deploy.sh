#!/bin/bash
# ./deploy.sh target/prod/szpion user@host /home/user/szpion 8888
app_file="$1";
user_host="$2";
target_dir="$3";
port="$4";
exec="$(basename $app_file)";
current_date_time="`date +%Y%m%d%H%M%S`";
echo "Deploying $app_file to $user_host in directory $target_dir as $exec on port $port"
set -x
scp $app_file $user_host:$target_dir/$exec-new
ssh $user_host << EOF
echo "Executing commands on remote host."
set -x
pkill $exec
mv $target_dir/$exec $target_dir/$exec-$current_date_time
mv $target_dir/$exec.log $target_dir/$exec.log-$current_date_time
mv $target_dir/$exec-new $target_dir/$exec
nohup $target_dir/$exec --port $port >> $target_dir/$exec.log 2>&1 &
echo "Disconnecting."
sleep 1
EOF
