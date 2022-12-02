#!/bin/zsh
node -v
echo "$1"
# 如果没有输入commit信息就中止发布
if [[ -z "${1}" ]]; then
    echo "请输入本次修改commit信息"
    exit 1
fi
# 进行git仓库的上传
git add .
git commit -m "$1"
git push
# 更新包 minor major
npm version patch
npm publish
