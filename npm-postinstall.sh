for d in */; do
    echo "Running yarn for $d"
    cd "$d"
    yarn
    cd ..
done