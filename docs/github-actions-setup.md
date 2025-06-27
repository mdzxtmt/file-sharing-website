# 🔄 GitHub Actions CI/CD 设置指南

## 📋 概述

本项目使用GitHub Actions实现自动化的持续集成和持续部署(CI/CD)流程。每次代码提交都会自动触发质量检查、构建验证和安全扫描。

## 🚀 工作流程

### 触发条件
- **Push到主分支**: `main`, `develop`
- **Pull Request**: 针对 `main`, `develop` 分支的PR

### 执行阶段

#### 1. 代码质量检查 (`quality-check`)
- **多版本测试**: Node.js 18 和 20
- **ESLint检查**: 代码风格和潜在问题检测
- **TypeScript检查**: 类型安全验证
- **构建验证**: 确保项目可以成功构建
- **服务配置检查**: 重用现有的 `check-services.js` 脚本

#### 2. 安全扫描 (`security-scan`)
- **依赖漏洞扫描**: `npm audit` 检查已知安全漏洞
- **安全审计**: 使用 `audit-ci` 进行深度安全检查

#### 3. 项目结构验证 (`structure-check`)
- **必需文件检查**: 验证关键配置文件存在
- **目录结构验证**: 确保项目结构完整

#### 4. 状态报告生成 (`status-report`)
- **汇总报告**: 生成详细的CI状态报告
- **下一步指导**: 提供后续操作建议

## 📁 相关文件

```
.github/
└── workflows/
    └── ci.yml              # 主CI工作流配置

scripts/
├── check-services.js       # 服务配置验证(重用)
└── ci-check.js            # CI环境检查脚本

package.json               # 包含CI相关的npm scripts
```

## 🔧 本地测试

在提交代码前，可以在本地运行相同的检查：

```bash
# 运行完整的CI检查
npm run ci:test

# 单独运行各项检查
npm run lint              # ESLint检查
npm run type-check        # TypeScript检查
npm run check-services    # 服务配置检查
npm run ci:env-check      # CI环境检查
npm run audit:security    # 安全审计
```

## 📊 状态徽章

项目README中包含CI状态徽章，显示最新的构建状态：

```markdown
[![CI/CD Pipeline](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/ci.yml)
```

## 🔍 故障排除

### 常见问题

1. **构建失败**
   - 检查Node.js版本兼容性
   - 确认所有依赖已正确安装
   - 验证环境变量配置

2. **ESLint错误**
   - 运行 `npm run lint -- --fix` 自动修复
   - 检查代码风格规范

3. **TypeScript错误**
   - 运行 `npm run type-check` 查看详细错误
   - 确认类型定义正确

4. **安全扫描警告**
   - 运行 `npm audit fix` 自动修复
   - 手动更新有漏洞的依赖

### 调试步骤

1. **查看详细日志**
   - 在GitHub Actions页面查看失败的job详情
   - 检查每个step的输出

2. **本地复现**
   - 在本地运行相同的命令
   - 使用相同的Node.js版本

3. **环境差异**
   - 检查本地和CI环境的差异
   - 确认环境变量设置

## 🔄 工作流优化

### 缓存策略
- **依赖缓存**: 缓存 `node_modules` 加速构建
- **构建缓存**: 缓存 `.next` 目录提高效率

### 并行执行
- 多个Node.js版本并行测试
- 独立的安全扫描job
- 结构检查与质量检查并行

### 错误处理
- `continue-on-error` 用于非关键检查
- 详细的错误报告和状态汇总
- 自动生成的状态报告

## 📈 下一步

1. **部署自动化**: 配置Vercel自动部署
2. **数据库迁移**: 集成Supabase迁移自动化
3. **通知系统**: 添加Slack/Discord通知
4. **性能测试**: 集成Lighthouse性能测试

---

**💡 提示**: 这个CI系统重用了项目现有的验证脚本，确保了一致性和可维护性。所有检查都可以在本地运行，便于开发调试。
