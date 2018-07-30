<template>
  <section class="container">
    <div v-if="$store.state.setting.exist_member" class="exist-info">
      <h1>{{$t('您已成功加入 "{ent_name}"', { ent_name: $store.state.setting.ent_name})}}</h1>
      <el-button type="text" @click="goYunku"> &gt;&gt; {{$t('开始使用云库')}}</el-button>
    </div>
    <div v-else>
      <h1>{{$t('您受邀加入 "{ent_name}"', { ent_name: $store.state.setting.ent_name})}}</h1>
      <div class="user-panel" :class="isLogin ? '' : 'register-panel'">
        <el-form :model="user" ref="form" @submit.native.prevent :rules="rules">
          <el-form-item prop="name" v-if="!isLogin">
            <el-input type="text" :placeholder="$t('显示名')" v-model="user.name">
              <i slot="prefix" class="fa fa-user"></i>
            </el-input>
          </el-form-item>
          <el-form-item prop="email">
            <el-input type="email" :placeholder="$t('邮箱')" v-model="user.email" @blur="refreshVerify" @input="refreshVerify">
              <i slot="prefix" class="fa fa-envelope"></i>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input type="password" :placeholder="$t('密码')" v-model="user.password" @keyup.enter.native="submitForm">
              <i slot="prefix" class="fa fa-lock"></i>
            </el-input>
          </el-form-item>
          <verify-code-item v-if="isLogin" ref="verify" prop="verify_code" v-model="user.verify_code"
                            uri="/index/verify5" @keyup.enter.native="submitForm"></verify-code-item>
          <el-button v-if="isLogin" type="primary" class="submit-btn" @click="submitForm" :loading="btnLoading">{{$t('登录并加入')}}
          </el-button>
          <el-button v-else type="success" class="submit-btn" @click="submitForm" :loading="btnLoading">{{$t('注册并加入')}}
          </el-button>
          <el-form-item>
            <el-button type="text" @click="toggleForm" class="toggle-form">{{isLogin ? $t('注册新账号加入?'):$t('使用已有账号加入?')}}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <i class="coffee"></i>
  </section>
</template>

<script>
  import VerifyCodeItem from '~/components/VerifyCodeItem';
  import {joinUs} from '~/assets/api';

  export default {
    components: {VerifyCodeItem},
    data() {
      return {
        user: {
          name: '',
          email: '',
          password: '',
          verify_code: ''
        },
        isLogin: false,
        btnLoading: false,
        rules: {
          email: [
            {required: true, message: this.$t('请输入邮箱地址'), trigger: 'blur'},
            {type: 'email', message: this.$t('邮箱格式错误'), trigger: 'blur'}
          ],
          name: [
            {
              validator: (rule, value, callback) => {
                if (value === '' && !this.isLogin) {
                  callback(new Error(rule.message));
                } else {
                  callback();
                }
              }, message: this.$t('请输入显示名'), trigger: 'blur'
            }
          ],
          password: [
            {required: true, message: this.$t('请输入密码'), trigger: 'blur'}
          ],
          verify_code: [
            {
              validator: (rule, value, callback) => {
                if (value === '' && this.$refs['verify'].show) {
                  callback(new Error(rule.message));
                } else {
                  callback();
                }
              }, message: this.$t('请输入验证码'), trigger: 'blur'
            }
          ]
        }
      }
    },
    methods: {
      submitForm() {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.btnLoading = true;
            let para = {
              t: this.$route.query.t,
              e: this.$route.query.e,
              s: this.$route.query.s,
              member_email: this.user.email,
              member_name: this.user.name,
              action: this.isLogin ? 'login' : 'regist',
              password: this.user.password,
              verify_code: this.user.verify_code
            };
            joinUs(para).then(() => {
              setTimeout(() => {
                window.top.location.href = '/';
              }, 1000);
            }, () => {
              this.refreshVerify();
              this.btnLoading = false
            });
          } else {
            return false;
          }
        });
      },
      toggleForm() {
        this.isLogin = !this.isLogin;
        this.$refs.form.resetFields();
      },
      refreshVerify() {
        if (!this.isLogin) {
          return false;
        }
        if (this.user.email) {
          this.$refs['verify'].refresh({
            account: this.user.email
          });
        } else {
          this.$refs['verify'].hide();
        }
      },
      goYunku() {
        location.href = '/web/index';
      }
    }
  }
</script>

<style scoped lang="scss">
  @import "~assets/styles/variables";

  .container {
    @extend .fullpage;
    background: #ebebeb;

    h1 {
      color: #4d4d4d;
      text-align: center;
      font-size: 30px;
      font-weight: 400;
      margin: 180px 0 50px;
    }

    .exist-info {
      text-align: center;

      h1 {
        margin-top: 300px;
      }
    }

    .register-panel {
      .fa {
        color: $color-success;
      }
    }
    .toggle-form {
      width: 100%;
      text-align: center;
    }

    .coffee {
      background: url("~/assets/images/coffee.png");
      height: 92px;
      width: 80px;
      display: block;
      position: absolute;
      bottom: 5%;
      right: 5%;
    }
  }
</style>
