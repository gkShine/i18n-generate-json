<template>
    <section class="container user-panel">
        <gk-logo></gk-logo>
        <el-form :model="form" @submit.native.prevent :rules="rules" ref="form">
            <el-form-item :label="$t('设置新密码')" prop="password">
                <el-input type="password" :placeholder="t('新密码')" v-model="form.password">
                    <i slot="prefix" class="fa fa-lock"></i>
                </el-input>
            </el-form-item>
            <el-form-item :label="$t('确认新密码')" prop="confirm_password">
                <el-input type="password" :placeholder="$t('确认新密码')" v-model="form.confirm_password"
                          @keyup.enter.native="submitForm">
                    <i slot="prefix" class="fa fa-lock"></i>
                </el-input>
            </el-form-item>
            <el-button type="primary" class="submit-btn" @click="submitForm" :loading="btnLoading">$t('提交')</el-button>
        </el-form>
    </section>
</template>

<script>
  import {findpasswordReset} from '~/assets/api'
  import GkLogo from '~/components/GkLogo';

  export default {
    components: {GkLogo},
    head() {
      return {
        title: this.$t('重设密码')
      };
    },
    data() {
      let validatePass = (rule, value, callback) => {
        if (value === '') {
          callback(new Error(this.$t('请再次输入密码')));
        } else if (value !== this.form.password) {
          callback(new Error(this.$t('两次输入密码不一致!')));
        } else {
          callback();
        }
      };
      return {
        form: {
          password: '',
          confirm_password: '',
        },
        btnLoading: false,
        rules: {
          confirm_password: [
            {required: true, validator: validatePass, trigger: 'blur'}
          ],
          password: [
            {required: true, message: this.$t('请输入密码'), trigger: 'blur'}
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
              code: this.$route.query.code,
              password: this.form.password
            };
            findpasswordReset(para).then((data) => {
              this.$message({
                message: this.$t('密码修改成功, 请重新登录'),
                type: 'success'
              });
              setTimeout(() => {
                location.href = '/account/login' + ((data && data.source) ? '?source=' + data.source : '');
              }, 2000);
              this.btnLoading = false;
            }, () => {
              this.btnLoading = false;
            });
          } else {
            return false;
          }
        });
      }
    }
  }
</script>
